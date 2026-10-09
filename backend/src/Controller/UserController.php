<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class UserController extends AbstractController
{
    #[Route('/api/user/upload-picture', name: 'api_user_upload_picture', methods: ['POST'])]
    public function uploadPicture(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser(); // On récupère l'utilisateur connecté grâce au JWT

        if (!$user) {
            return new JsonResponse(['error' => 'Utilisateur non trouvé'], 401);
        }

        $file = $request->files->get('image'); // 'image' correspond au formData.append('image', file) du front
        if (!$file) {
            return new JsonResponse(['error' => 'Aucun fichier reçu'], 400);
        }

        // 1. Définir le dossier de stockage (public/uploads/profiles)
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads/profiles';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // 2. Créer un nom unique pour l'image
        $filename = uniqid() . '.' . $file->guessExtension();
        $file->move($uploadDir, $filename);

        // 3. Sauvegarder le chemin en base de données
        $url = '/uploads/profiles/' . $filename;
        $user->setPicture($url);
        
        $em->persist($user);
        $em->flush(); // C'est CA qui remplit ta base de données !

        return new JsonResponse(['picture' => $url]);
    }
    
    #[Route('/api/profile/update', name: 'api_profile_update', methods: ['PUT'])]
    public function updateProfile(
        Request $request,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return new JsonResponse([
                'message' => 'Utilisateur non authentifié'
            ], 401);
        }

        $data = json_decode($request->getContent(), true);

        // Mise à jour des champs
        $user->setName($data['name'] ?? $user->getName());
        $user->setEmail($data['email'] ?? $user->getEmail());
        $user->setTelephone($data['telephone'] ?? $user->getTelephone());

        $em->persist($user);
        $em->flush();

        return new JsonResponse([
            'message' => 'Profil mis à jour avec succès',
            'user' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'telephone' => $user->getTelephone(),
                'picture' => $user->getPicture(),
                'roles' => $user->getRoles(),
            ]
        ]);
    }

    #[Route('/api/me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();

        if (!$user) {
            return new JsonResponse(['message' => 'Non authentifié'], 401);
        }

        return $this->json([
            'data' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'telephone' => $user->getTelephone(),
                'picture' => $user->getPicture(),
                'roles' => $user->getRoles(),
            ]
        ]);
    }
        

}