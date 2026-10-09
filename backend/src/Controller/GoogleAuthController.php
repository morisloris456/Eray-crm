<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use GuzzleHttp\Client as GuzzleClient;

class GoogleAuthController extends AbstractController
{
    #[Route('/api/auth/google', name: 'api_google_auth', methods: ['POST'])]
    public function googleAuth(
        Request $request, 
        EntityManagerInterface $em, 
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $accessToken = $data['token'] ?? null;

        if (!$accessToken) {
            return new JsonResponse(['error' => 'Token manquant'], 400);
        }

        try {
            $client = new GuzzleClient(['verify' => false]);
            $response = $client->get('https://www.googleapis.com/oauth2/v3/userinfo', [
                'headers' => ['Authorization' => 'Bearer ' . $accessToken],
            ]);

            $payload = json_decode($response->getBody()->getContents(), true);

            if (isset($payload['email'])) {
                $email = $payload['email'];
                $name = $payload['name'] ?? explode('@', $email)[0];
                
                // --- L'AJOUT EST ICI ---
                $picture = $payload['picture'] ?? null; 

                $user = $em->getRepository(User::class)->findOneBy(['email' => $email]);

                if (!$user) {
                    $user = new User();
                    $user->setEmail($email);
                    $user->setName($name);
                    $user->setPicture($picture); // Enregistre la photo à la création
                    $user->setPassword(bin2hex(random_bytes(15))); 
                    
                    if (method_exists($user, 'setRoles')) {
                        $user->setRoles(['ROLE_USER']);
                    }

                    $em->persist($user);
                } else {
                    // Optionnel : Mettre à jour la photo si elle a changé sur Google
                    $user->setPicture($picture);
                }

                $em->flush();

                $token = $jwtManager->create($user);

                return new JsonResponse([
                    'token' => $token,
                    'user' => [
                        'id' => $user->getId(),
                        'email' => $user->getEmail(),
                        'name' => $user->getName(),
                        'roles' => $user->getRoles(),
                        'picture' => $user->getPicture(), 
                        'telephone' => $user->getTelephone(), 
                    ]
                ]);
            }

            return new JsonResponse(['error' => 'Invalide'], 401);

        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}