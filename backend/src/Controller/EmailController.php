<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Annotation\Route;

class EmailController extends AbstractController
{
    #[Route('/api/send-reminder', name: 'api_send_reminder', methods: ['POST'])]
    public function sendReminder(Request $request, MailerInterface $mailer): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $to = $data['email'];
        $eventTitle = $data['title'];
        $eventDate = $data['date'];
        $eventTime = $data['time'];

        $email = (new Email())
            ->from('votre-crm@eray.mg')
            ->to($to)
            ->subject('Rappel de votre rendez-vous : ' . $eventTitle)
            ->html("
                <h1>Rappel de rendez-vous</h1>
                <p>Bonjour,</p>
                <p>Ceci est un rappel pour votre rendez-vous <strong>{$eventTitle}</strong>.</p>
                <p>Date : <strong>{$eventDate}</strong> à <strong>{$eventTime}</strong>.</p>
                <p>Cordialement,<br>L'équipe Eray CRM</p>
            ");

        try {
            $mailer->send($email);
            return new JsonResponse(['status' => 'Email envoyé !']);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}