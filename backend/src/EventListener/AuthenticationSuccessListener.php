<?php

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Symfony\Component\Security\Core\User\UserInterface;
use App\Entity\User; // Assure-toi d'importer ton entité User

class AuthenticationSuccessListener
{
    public function onAuthenticationSuccessResponse(AuthenticationSuccessEvent $event): void
    {
        $data = $event->getData();
        $user = $event->getUser();

        // On vérifie que c'est bien notre entité User pour accéder au getter getPicture()
        if (!$user instanceof User) {
            return;
        }

        // On ajoute les infos de l'utilisateur dans la réponse
        $data['user'] = [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'roles' => $user->getRoles(),
            'picture' => $user->getPicture(), 
            'telephone' => $user->getTelephone(),
        ];

        $event->setData($data);
    }
}