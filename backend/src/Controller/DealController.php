<?php

namespace App\Controller;

use App\Entity\Deal;
use App\Enum\ProspectionStatut;
use App\Repository\DealRepository;
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

#[Route('/api/deals', name: 'api_deals_')]
final class DealController extends AbstractController
{
    /* ===================
       GET LIST
    ====================*/
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(DealRepository $dealRepository, SerializerInterface $serializer): JsonResponse
    {
        $deals = $dealRepository->findAll();

        return $this->json([
            'success' => true,
            'data' => $deals
        ], 200, [], ['groups' => 'getDeals']);
    }

    /* ===================
       GET DETAIL
    ====================*/
    #[Route('/{id}', name: 'detail', methods: ['GET'])]
    public function detail(Deal $deal): JsonResponse
    {
        return $this->json([
            'success' => true,
            'data' => $deal
        ], 200, [], ['groups' => 'getDeals']);
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
        Security $security   
    ): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if ($data === null) {
            return $this->json(['success' => false, 'error' => 'JSON invalide'], 400);
        }

        if (empty($data['client_id'])) {
            return $this->json(['success' => false, 'error' => 'client_id est obligatoire'], 400);
        }

        $client = $clientRepository->find($data['client_id']);
        if (!$client) {
            return $this->json(['success' => false, 'error' => 'Client non trouvé'], 404);
        }

        $deal = new Deal();
        $deal->setClient($client);
        $deal->setCreatedBy($security->getUser()); 
        $deal->setTitle($data['title'] ?? null);
       
        $deal->setStage(ProspectionStatut::from($data['stage'] ?? 'prospect'));
        $deal->setDate(!empty($data['date']) ? new \DateTime($data['date']) : new \DateTime());
        $deal->setDescription($data['description'] ?? null);
        $deal->setProbability(!empty($data['probability']) ? (float)$data['probability'] : null);
        $deal->setExpectedCloseDate(!empty($data['expectedCloseDate']) ? new \DateTime($data['expectedCloseDate']) : null);
        $deal->setAssignedTo($data['assignedTo'] ?? null);
        
        if (array_key_exists('amount', $data) && $data['amount'] !== null && $data['amount'] !== '') {
            // Si le montant est fourni et n'est pas vide, on le stocke en string (pour le type DECIMAL)
            $deal->setAmount((string)$data['amount']);
        } else {
            // Sinon, on le laisse à null
            $deal->setAmount(null);
        }

        // Validation
        $errors = $validator->validate($deal);
        if ($errors->count() > 0) {
            return $this->json([
                'success' => false,
                'errors' => json_decode($serializer->serialize($errors, 'json'), true)
            ], 400);
        }

        $em->persist($deal);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Deal créé avec succès',
            'data' => $deal
        ], 201, [
            'Location' => $urlGenerator->generate('api_deals_detail', ['id' => $deal->getId()], UrlGeneratorInterface::ABSOLUTE_URL)
        ], ['groups' => 'getDeals']);
    }

    /* ===================
       PUT UPDATE
    ====================*/
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_USER')]
    public function update(
        Request $request,
        Deal $currentDeal,
        EntityManagerInterface $em,
        ValidatorInterface $validator,
        ClientRepository $clientRepository
    ): JsonResponse {
    
        $data = json_decode($request->getContent(), true);
    
        if ($data === null) {
            return $this->json(['success' => false, 'error' => 'JSON invalide'], 400);
        }
    
        /* ===================
           CLIENT
        ====================*/
        if (!empty($data['client_id'])) {
            $client = $clientRepository->find($data['client_id']);
            if (!$client) {
                return $this->json(['success' => false, 'error' => 'Client non trouvé'], 404);
            }
            $currentDeal->setClient($client);
        }
    
        /* ===================
           TITLE
        ====================*/
        if (!empty($data['title'])) {
            $currentDeal->setTitle($data['title']);
        }
    

        /* ===================
            AMOUNT 
        ====================*/
        if (array_key_exists('amount', $data)) {
            if ($data['amount'] !== null && $data['amount'] !== '') {
                $currentDeal->setAmount((string)$data['amount']);
            } else {
                $currentDeal->setAmount(null);
            }
        }
    
        /* ===================
           STAGE (ENUM SAFE)
        ====================*/
        if (!empty($data['stage'])) {
            try {
                $currentDeal->setStage(
                    \App\Enum\ProspectionStatut::from($data['stage'])
                );
            } catch (\ValueError $e) {
                return $this->json([
                    'success' => false,
                    'error' => 'Stage invalide'
                ], 400);
            }
        }
    
        /* ===================
           DATE (SAFE)
        ====================*/
        if (!empty($data['date'])) {
            try {
                $currentDeal->setDate(new \DateTime($data['date']));
            } catch (\Exception $e) {
                return $this->json([
                    'success' => false,
                    'error' => 'Date invalide'
                ], 400);
            }
        }
    
        /* ===================
           EXPECTED CLOSE DATE (SAFE)
        ====================*/
        if (!empty($data['expectedCloseDate'])) {
            try {
                $currentDeal->setExpectedCloseDate(new \DateTime($data['expectedCloseDate']));
            } catch (\Exception $e) {
                return $this->json([
                    'success' => false,
                    'error' => 'Date de clôture invalide'
                ], 400);
            }
        }
    
        /* ===================
           DESCRIPTION
        ====================*/
        if (array_key_exists('description', $data)) {
            $currentDeal->setDescription($data['description']);
        }
    
        /* ===================
           PROBABILITY
        ====================*/
        if (isset($data['probability'])) {
            $currentDeal->setProbability((float) $data['probability']);
        }
    
        /* ===================
           ASSIGNED TO
        ====================*/
        if (array_key_exists('assignedTo', $data)) {
            $currentDeal->setAssignedTo($data['assignedTo']);
        }
    
        /* ===================
           VALIDATION
        ====================*/
        $errors = $validator->validate($currentDeal);
        if (count($errors) > 0) {
            return $this->json([
                'success' => false,
                'errors' => $errors
            ], 400);
        }
    
        $em->flush();
    
        return $this->json([
            'success' => true,
            'message' => 'Deal mis à jour avec succès',
            'data' => $currentDeal
        ], 200, [], ['groups' => 'getDeals']);
    }
    /* ===================
       DELETE
    ====================*/
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_USER')]
    public function delete(Deal $deal, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($deal);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Deal supprimé'
        ], 200);
    }
}