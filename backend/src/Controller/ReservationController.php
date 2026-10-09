<?php

namespace App\Controller;

use App\Entity\Reservation;
use App\Enum\ReservationStatut;
use App\Enum\InteractionType;
use App\Repository\ReservationRepository;
use App\Repository\ProjetRepository;
use App\Repository\ClientRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Bundle\SecurityBundle\Security;

#[Route('/api/reservations', name: 'api_reservations_')]
final class ReservationController extends AbstractController
{
    /* ===================
       GET LISTE
    ====================*/
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(ReservationRepository $reservationRepository, Request $request): JsonResponse
    {
        $statut = $request->query->get('statut');

        if ($statut) {
            $reservations = $reservationRepository->findBy([
                'statut' => ReservationStatut::from($statut)
            ]);
        } else {
            $reservations = $reservationRepository->findAll();
        }

        return $this->json([
            'success' => true,
            'data' => $reservations
        ], 200, [], ['groups' => 'getReservations']);
    }

    /* ===================
       GET DETAIL
    ====================*/
    #[Route('/{id}', name: 'detail', methods: ['GET'])]
    public function detail(Reservation $reservation): JsonResponse
    {
        return $this->json([
            'success' => true,
            'data' => $reservation
        ], 200, [], ['groups' => 'getReservations']);
    }

    /* ===================
       POST CREATE
    ====================*/
    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(
        Request $request,
        SerializerInterface $serializer,
        ProjetRepository $projetRepository,
        ClientRepository $clientRepository,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
        UrlGeneratorInterface $urlGenerator,
        Security $security
    ): JsonResponse {
    
        // 1. Récupération robuste des données
        try {
            $data = $request->toArray();
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => 'JSON invalide ou corps de requête vide'
            ], 400);
        }
    
        // 2. CLIENT obligatoire
        if (!isset($data['client_id']) || $data['client_id'] === '') {
            return $this->json([
                'success' => false,
                'error' => 'client_id est obligatoire'
            ], 400);
        }
    
        // 3. CLIENT lookup
        $client = $clientRepository->find($data['client_id']);
        if (!$client) {
            return $this->json([
                'success' => false,
                'error' => 'Client introuvable (ID: '.$data['client_id'].')'
            ], 404);
        }
    
        // 4. PROJET OPTIONNEL (🔥 FIX IMPORTANT)
        $projet = null;
    
        if (!empty($data['projet_id'])) {
            $projet = $projetRepository->find($data['projet_id']);
    
            if (!$projet) {
                return $this->json([
                    'success' => false,
                    'error' => 'Projet introuvable (ID: '.$data['projet_id'].')'
                ], 404);
            }
        }
    
        // 5. Création réservation
        try {
            $reservation = new Reservation();
            $reservation->setCreatedBy($security->getUser());
            $reservation->setTitle($data['title'] ?? 'Sans titre');
            $reservation->setDescription($data['description'] ?? '');
            $reservation->setLieu($data['lieu'] ?? '');
    
            $statutValue = $data['statut'] ?? 'planifie';
            $typeValue = $data['type'] ?? 'Réunion';
    
            $reservation->setStatut(
                ReservationStatut::tryFrom($statutValue) ?? ReservationStatut::EN_ATTENTE
            );
    
            $reservation->setType(
                InteractionType::tryFrom($typeValue) ?? InteractionType::APPEL
            );
    
            // relations
            $reservation->setClient($client);
            $reservation->setProjet($projet); // 🔥 peut être null maintenant
    
            // date
            if (!empty($data['date'])) {
                $reservation->setDate(new \DateTime($data['date']));
            }
    
            // time
            if (!empty($data['time'])) {
                $reservation->setTime(new \DateTime($data['time']));
            }
    
            // durée
            if (isset($data['duree'])) {
                $reservation->setDuree((int)$data['duree']);
            }
    
            // validation
            $errors = $validator->validate($reservation);
            if ($errors->count() > 0) {
                return $this->json([
                    'success' => false,
                    'errors' => json_decode($serializer->serialize($errors, 'json'), true)
                ], 400);
            }
    
            // save
            $em->persist($reservation);
            $em->flush();
    
            return $this->json([
                'success' => true,
                'message' => 'Réservation créée avec succès',
                'data' => $reservation
            ], 201, [
                'Location' => $urlGenerator->generate(
                    'api_reservations_detail',
                    ['id' => $reservation->getId()],
                    UrlGeneratorInterface::ABSOLUTE_URL
                )
            ], ['groups' => 'getReservations']);
    
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => 'Erreur technique : ' . $e->getMessage()
            ], 500);
        }
    }

    /* ===================
       PUT UPDATE
    ====================*/
  
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function update(
        Request $request,
        Reservation $currentReservation,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
        ClientRepository $clientRepository,
        ProjetRepository $projetRepository
    ): JsonResponse {
    
        try {
            $data = $request->toArray();
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'error' => 'JSON invalide'
            ], 400);
        }
    
        // =====================
        // BASIC FIELDS
        // =====================
        $currentReservation->setTitle($data['title'] ?? $currentReservation->getTitle());
        $currentReservation->setDescription($data['description'] ?? $currentReservation->getDescription());
        $currentReservation->setLieu($data['lieu'] ?? $currentReservation->getLieu());
    
        if (isset($data['statut'])) {
            $currentReservation->setStatut(
                ReservationStatut::tryFrom($data['statut']) ?? $currentReservation->getStatut()
            );
        }
    
        if (isset($data['type'])) {
            $currentReservation->setType(
                InteractionType::tryFrom($data['type']) ?? $currentReservation->getType()
            );
        }
    
        if (!empty($data['date'])) {
            $currentReservation->setDate(new \DateTime($data['date']));
        }
    
        if (!empty($data['time'])) {
            $currentReservation->setTime(new \DateTime($data['time']));
        }
    
        if (isset($data['duree'])) {
            $currentReservation->setDuree((int)$data['duree']);
        }
    
        // =====================
        // FIX IMPORTANT ICI 🔥
        // =====================
    
        // client_id (et pas clientId)
        if (isset($data['client_id'])) {
            $client = $clientRepository->find($data['client_id']);
            if ($client) {
                $currentReservation->setClient($client);
            }
        }
    
        // projet_id (et pas projectId)
        if (isset($data['projet_id'])) {
            $projet = $projetRepository->find($data['projet_id']);
            if ($projet) {
                $currentReservation->setProjet($projet);
            }
        }
    
        // =====================
        // VALIDATION
        // =====================
        $errors = $validator->validate($currentReservation);
        if ($errors->count() > 0) {
            return $this->json([
                'success' => false,
                'errors' => json_decode(
                    $this->container->get('serializer')->serialize($errors, 'json'),
                    true
                )
            ], 400);
        }
    
        $em->flush();
    
        return $this->json([
            'success' => true,
            'data' => $currentReservation
        ], 200, [], ['groups' => 'getReservations']);
    }

    /* ===================
       DELETE
    ====================*/
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(Reservation $reservation, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($reservation);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Réservation supprimée'
        ], 200);
    }

    /* ===================
       PATCH CHANGE STATUT / TYPE
    ====================*/
    #[Route('/{id}/change-statut', name: 'change', methods: ['PATCH'])]
    #[IsGranted('ROLE_USER')]
    public function changeStatutOrType(Request $request, Reservation $reservation, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

     
        if (isset($data['statut'])) {
            $reservation->setStatut(ReservationStatut::from($data['statut']));
        }

      
        if (isset($data['type'])) {
            $reservation->setType(InteractionType::from($data['type']));
        }

        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Mise à jour réussie',
            'data' => $reservation
        ], 200, [], ['groups' => 'getReservations']);
    }
}