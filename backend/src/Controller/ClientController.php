<?php

namespace App\Controller;

use App\Entity\Client;
use App\Enum\ActifStatut;
use App\Repository\ClientRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Serializer\Normalizer\AbstractNormalizer;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Bundle\SecurityBundle\Security;

#[Route('/api/clients', name: 'api_clients_')]
final class ClientController extends AbstractController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(
        ClientRepository $clientRepository,
        SerializerInterface $serializer,
        Request $request
    ): JsonResponse {
        $statutActif = $request->query->get('statutActif'); // ex: ?statutActif=actif

        if ($statutActif) {
            $clients = $clientRepository->findByStatutActif(ActifStatut::from($statutActif));
        } else {
            $clients = $clientRepository->findAll();
        }

        $json = $serializer->serialize($clients, 'json', ['groups' => 'getClients']);
        return new JsonResponse($json, JsonResponse::HTTP_OK, [], true);
    }

    #[Route('/{id}', name: 'detail', methods: ['GET'])]
    public function detail(Client $client, SerializerInterface $serializer): JsonResponse
    {
        $json = $serializer->serialize($client, 'json', ['groups' => 'getClients']);
        return new JsonResponse($json, JsonResponse::HTTP_OK, [], true);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(
    Request $request,
    SerializerInterface $serializer,
    EntityManagerInterface $em,
    UrlGeneratorInterface $urlGenerator,
    ValidatorInterface $validator,
    Security $security
    ): JsonResponse {
        $client = $serializer->deserialize($request->getContent(), Client::class, 'json');

       
        $client->setCreatedBy($security->getUser());

        $errors = $validator->validate($client);
        if ($errors->count() > 0) {
            return new JsonResponse(
                $serializer->serialize($errors, 'json'),
                JsonResponse::HTTP_BAD_REQUEST,
                [],
                true
            );
        }

        $em->persist($client);
        $em->flush();

        $json = $serializer->serialize($client, 'json', ['groups' => 'getClients']);

        $location = $urlGenerator->generate(
            'api_clients_detail',
            ['id' => $client->getId()],
            UrlGeneratorInterface::ABSOLUTE_URL
        );

        return new JsonResponse($json, JsonResponse::HTTP_CREATED, ['Location' => $location], true);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function update(
        Request $request,
        SerializerInterface $serializer,
        Client $currentClient,
        EntityManagerInterface $em,
        ValidatorInterface $validator
    ): JsonResponse {
        $updatedClient = $serializer->deserialize(
            $request->getContent(),
            Client::class,
            'json',
            [
                AbstractNormalizer::OBJECT_TO_POPULATE => $currentClient,
                AbstractNormalizer::IGNORED_ATTRIBUTES => ['createdBy', 'createdAt'],
            ]
        );
    
        $errors = $validator->validate($updatedClient);
        if ($errors->count() > 0) {
            return new JsonResponse(
                $serializer->serialize($errors, 'json'),
                JsonResponse::HTTP_BAD_REQUEST,
                [],
                true
            );
        }
    
        $em->flush();
    
        return $this->json(
            $updatedClient,
            JsonResponse::HTTP_OK,
            [],
            ['groups' => 'getClients']
        );
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(Client $client, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($client);
        $em->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/change-statut', name: 'change_statut', methods: ['PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function changeStatut(
        Request $request,
        Client $client,
        EntityManagerInterface $em
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        if (isset($data['statutActif'])) {
            $client->setStatutActif(ActifStatut::from($data['statutActif']));
        }

        $em->flush();

        return new JsonResponse(['message' => 'Statut mis à jour'], JsonResponse::HTTP_OK);
    }
}