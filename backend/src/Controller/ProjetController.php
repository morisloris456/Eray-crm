<?php

namespace App\Controller;

use App\Entity\Projet;
use App\Enum\ProjetStatut;
use App\Enum\PrioriteStatut;
use App\Repository\ProjetRepository;
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
use App\Repository\ClientRepository;
use App\Repository\DealRepository;
use Symfony\Bundle\SecurityBundle\Security;

#[Route('/api/projets', name: 'api_projets_')]
final class ProjetController extends AbstractController
{
    /* ===================
       GET LISTE
    ====================*/
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(ProjetRepository $projetRepository, SerializerInterface $serializer, Request $request): JsonResponse
    {
        $statut = $request->query->get('statut');
        $priorite = $request->query->get('priorite');

        if ($statut) {
            $projets = $projetRepository->findByStatut(ProjetStatut::from($statut));
        } elseif ($priorite) {
            $projets = $projetRepository->findByPriorite(PrioriteStatut::from($priorite));
        } else {
            $projets = $projetRepository->findAll();
        }

        return $this->json([
            'success' => true,
            'data' => $projets
        ], 200, [], ['groups' => 'getProjets']);
    }

    /* ===================
       GET DETAIL
    ====================*/
    #[Route('/{id}', name: 'detail', methods: ['GET'])]
    public function detail(Projet $projet): JsonResponse
    {
        return $this->json([
            'success' => true,
            'data' => $projet
        ], 200, [], ['groups' => 'getProjets']);
    }

    /* ===================
       POST CREATE
    ====================*/
    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(
        Request $request,
        SerializerInterface $serializer,
        EntityManagerInterface $em,
        UrlGeneratorInterface $urlGenerator,
        ValidatorInterface $validator,
        ClientRepository $clientRepository,
        DealRepository $dealRepository,
        Security $security
    ): JsonResponse {

        $data = json_decode($request->getContent(), true);

        if ($data === null) {
            return $this->json(['success' => false, 'error' => 'JSON invalide'], 400);
        }

        $client = null;

        if (!empty($data['client_id'])) {
            $client = $clientRepository->find($data['client_id']);
        
            if (!$client) {
                return $this->json([
                    'success' => false,
                    'error' => 'Client non trouvé'
                ], 404);
            }
        }

        $deal = null;

        if (!empty($data['deal_id'])) {
            $deal = $dealRepository->find($data['deal_id']);

            if (!$deal) {
                return $this->json([
                    'success' => false,
                    'error' => 'Deal non trouvé'
                ], 404);
            }
        }

        $projet = new Projet();
        $projet->setCreatedBy($security->getUser());
        $projet->setNom($data['title'] ?? $data['nom'] ?? null); // Accepte les deux
        $projet->setStatut(ProjetStatut::from($data['statut'] ?? 'en_cours'));
        $projet->setPriorite(PrioriteStatut::from($data['priorite'] ?? 'moyenne'));
        $projet->setDateDebut(new \DateTime($data['startDate'] ?? $data['dateDebut'] ?? 'now'));
        $projet->setClient($client);
        $projet->setDeal($deal);
        $projet->setProgress($data['progress'] ?? 0);
        $projet->setDescription($data['description'] ?? '');

        if (!empty($data['endDate'])) {
            $projet->setDateFin(new \DateTime($data['endDate']));
        }
        if (!empty($data['budget'])) {
            $projet->setBudget((float)$data['budget']);
        }
        if (!empty($data['equipe'])) {
            $projet->setEquipe($data['equipe']);
        }

        // Validation
        $errors = $validator->validate($projet);
        if ($errors->count() > 0) {
            return $this->json([
                'success' => false,
                'errors' => json_decode($serializer->serialize($errors, 'json'), true)
            ], 400);
        }

        $em->persist($projet);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Projet créé avec succès',
            'data' => $projet
        ], 201, [
            'Location' => $urlGenerator->generate('api_projets_detail', ['id' => $projet->getId()], UrlGeneratorInterface::ABSOLUTE_URL)
        ], ['groups' => 'getProjets']);
    }

    /* ===================
       PUT UPDATE
    ====================*/
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function update(
        Request $request,
        SerializerInterface $serializer,
        Projet $currentProjet,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
        DealRepository $dealRepository   
    ): JsonResponse {

        $updatedProjet = $serializer->deserialize(
            $request->getContent(),
            Projet::class,
            'json',
            [AbstractNormalizer::OBJECT_TO_POPULATE => $currentProjet]
        );

        // 🔥 AJOUT IMPORTANT : gestion du deal_id manuellement
        $data = json_decode($request->getContent(), true);

        if (array_key_exists('deal_id', $data)) {
            $deal = $data['deal_id']
                ? $dealRepository->find($data['deal_id'])
                : null;

            if ($data['deal_id'] && !$deal) {
                return $this->json([
                    'success' => false,
                    'error' => 'Deal non trouvé'
                ], 404);
            }

            $currentProjet->setDeal($deal);
        }

        // validation
        $errors = $validator->validate($updatedProjet);
        if ($errors->count() > 0) {
            return $this->json([
                'success' => false,
                'errors' => json_decode($serializer->serialize($errors, 'json'), true)
            ], 400);
        }

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Projet mis à jour'
        ], 200);
    }

    /* ===================
       DELETE
    ====================*/
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(Projet $projet, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($projet);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Projet supprimé'
        ], 200);
    }

    /* ===================
       PATCH CHANGE STATUT
    ====================*/
    #[Route('/{id}/change-statut', name: 'change_statut', methods: ['PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function changeStatut(Request $request, Projet $projet, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (isset($data['statut'])) {
            $projet->setStatut(ProjetStatut::from($data['statut']));
        }

        if (isset($data['priorite'])) {
            $projet->setPriorite(PrioriteStatut::from($data['priorite']));
        }

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Statut mis à jour',
            'data' => $projet
        ], 200, [], ['groups' => 'getProjets']);
    }
}