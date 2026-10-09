<?php

namespace App\Command;

use App\Repository\ReservationRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

#[AsCommand(
    name: 'app:send-reminders',
    description: 'Envoie un rappel aux clients et un récapitulatif à l\'admin pour demain',
)]
class SendRemindersCommand extends Command
{
    public function __construct(
        private ReservationRepository $reservationRepository,
        private MailerInterface $mailer
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $adminEmail  = $_ENV['MAILER_ADMIN'] ?? 'lyviaraj@gmail.com';
        $tomorrow    = new \DateTime('tomorrow');
        $tomorrowStr = $tomorrow->format('d/m/Y');

        $io->title("📬 Envoi des rappels pour le $tomorrowStr");

        $reservations = $this->reservationRepository->findBy(['date' => $tomorrow]);

        if (empty($reservations)) {
            $io->info("Aucun rendez-vous prévu pour demain ($tomorrowStr).");
            return Command::SUCCESS;
        }

        $io->info(count($reservations) . " rendez-vous trouvé(s) pour demain.");

        $listeHtmlAdmin  = "<ul style='list-style-type:none;padding:0;'>";
        $clientsEnvoyes  = 0;
        $createursEnvoyes = 0;

        foreach ($reservations as $index => $res) {

            $io->section("Rendez-vous #" . ($index + 1) . " — " . $res->getTitle());

            // ── Données client ────────────────────────────────────────────
            $client      = $res->getClient();
            $nomClient   = $client
                ? ($client->getNomClient() ?? $client->getNomEntreprise() ?? 'Client inconnu')
                : 'Client inconnu';
            $emailClient = $client ? $client->getEmail() : null;

            // ── Données créateur ──────────────────────────────────────────
            $creator      = $res->getCreatedBy();
            $creatorName  = $creator ? ($creator->getName() ?? 'Utilisateur') : null;
            $creatorEmail = $creator ? $creator->getEmail() : null;

            // ── Autres infos ──────────────────────────────────────────────
            $heure     = $res->getTime() ? $res->getTime()->format('H:i') : '--:--';            $type      = $res->getType();
            $typeLabel = $type ? $type->getLabel() : 'Type inconnu';        
            // ── Diagnostic console ────────────────────────────────────────
            $io->writeln("   Heure      : $heure");
            $io->writeln("   Client     : $nomClient (" . ($emailClient ?? ' pas d\'email') . ")");
            $io->writeln("  Créateur  : " . ($creatorName ?? ' NULL — getCreatedBy() retourne null'));
            $io->writeln("   Email créateur : " . ($creatorEmail ?? ' NULL'));

            if ($creatorEmail && !filter_var($creatorEmail, FILTER_VALIDATE_EMAIL)) {
                $io->writeln("   Email créateur invalide : $creatorEmail");
            }

            // ── Bloc Admin ────────────────────────────────────────────────
            $listeHtmlAdmin .= "
            <li style='margin-bottom:15px;padding:10px;border-left:4px solid #3498db;background:#f9f9f9;'>
                <strong style='font-size:1.1em;'>$heure — {$res->getTitle()}</strong> ($typeLabel)<br>
                <span>Client : <strong>$nomClient</strong></span><br>
                <span>Créateur : <strong>" . ($creatorName ?? 'Inconnu') . "</strong></span>
            </li>";

            // ── Email → Client ────────────────────────────────────────────
            if ($emailClient && filter_var($emailClient, FILTER_VALIDATE_EMAIL)) {
                $emailAuClient = (new Email())
                    ->from($adminEmail)
                    ->to($emailClient)
                    ->subject(" Rappel : Votre rendez-vous de demain — Eray")
                    ->html("
                        <div style='font-family:Arial,sans-serif;color:#333;line-height:1.6;background:#f9fafb;padding:24px;'>
                            <div style='max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;'>
                                <div style='background:#1d4ed8;color:#ffffff;padding:24px 30px;'>
                                    <h1 style='margin:0;font-size:24px;font-weight:700;'>Rappel de rendez-vous</h1>
                                </div>
                                <div style='padding:24px 30px;'>
                                    <p style='margin:0 0 16px;'>Bonjour $nomClient,</p>
                                    <p style='margin:0 0 24px;'>Nous vous rappelons votre rendez-vous prévu demain. Retrouvez ci-dessous les détails importants :</p>
                                    <table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;margin-bottom:24px;'>
                                        <tr>
                                            <td style='padding:12px 0;font-size:14px;color:#475569;'>Date</td>
                                            <td style='padding:12px 0;font-weight:600;color:#0f172a;'>$tomorrowStr</td>
                                        </tr>
                                        <tr>
                                            <td style='padding:12px 0;font-size:14px;color:#475569;'>Heure</td>
                                            <td style='padding:12px 0;font-weight:600;color:#0f172a;'>$heure</td>
                                        </tr>
                                        <tr>
                                            <td style='padding:12px 0;font-size:14px;color:#475569;'>Type</td>
                                            <td style='padding:12px 0;font-weight:600;color:#0f172a;'>$typeLabel</td>
                                        </tr>
                                        <tr>
                                            <td style='padding:12px 0;font-size:14px;color:#475569;'>Objet</td>
                                            <td style='padding:12px 0;font-weight:600;color:#0f172a;'>{$res->getTitle()}</td>
                                        </tr>
                                    </table>
                                    <p style='margin:0 0 24px;color:#334155;'>Vous pouvez répondre à cet e-mail ou contacter votre interlocuteur si vous souhaitez modifier ou annuler ce rendez-vous.</p>
                                    <p style='margin:0;color:#475569;'>Cordialement,<br><strong>L'équipe Eray</strong></p>
                                </div>
                            </div>
                        </div>
                    ");

                try {
                    $this->mailer->send($emailAuClient);
                    $clientsEnvoyes++;
                    $io->writeln("   Email client envoyé à : $emailClient");
                } catch (\Exception $e) {
                    $io->warning("   Erreur email client ($nomClient) : " . $e->getMessage());
                }
            } else {
                $io->writeln("   Email client ignoré (adresse absente ou invalide).");
            }

            // ── Email → Créateur ──────────────────────────────────────────
            if ($creatorEmail && filter_var($creatorEmail, FILTER_VALIDATE_EMAIL)) {

                // Si le créateur est aussi l'admin, on le précise dans les logs
                if ($creatorEmail === $adminEmail) {
                    $io->writeln("  ℹ Le créateur EST l'admin — l'email partira quand même séparément.");
                }

                $emailAuCreateur = (new Email())
                    ->from($adminEmail)
                    ->to($creatorEmail)
                    ->subject(" Rappel : Rendez-vous que vous avez créé pour demain")
                    ->html("
                        <div style='font-family:Arial,sans-serif;color:#333;line-height:1.6;background:#f9fafb;padding:24px;'>
                            <div style='max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;'>
                                <div style='background:#1d4ed8;color:#ffffff;padding:24px 30px;'>
                                    <h1 style='margin:0;font-size:24px;font-weight:700;'>Rappel du rendez-vous créé</h1>
                                </div>
                                <div style='padding:24px 30px;'>
                                    <p style='margin:0 0 16px;'>Bonjour $creatorName,</p>
                                    <p style='margin:0 0 24px;'>Voici le rappel du rendez-vous que vous avez planifié pour demain :</p>
                                    <table width='100%' cellpadding='0' cellspacing='0' style='border-collapse:collapse;margin-bottom:24px;'>
                                        <tr>
                                            <td style='padding:12px 0;font-size:14px;color:#475569;'>Date</td>
                                            <td style='padding:12px 0;font-weight:600;color:#0f172a;'>$tomorrowStr</td>
                                        </tr>
                                        <tr>
                                            <td style='padding:12px 0;font-size:14px;color:#475569;'>Heure</td>
                                            <td style='padding:12px 0;font-weight:600;color:#0f172a;'>$heure</td>
                                        </tr>
                                        <tr>
                                            <td style='padding:12px 0;font-size:14px;color:#475569;'>Type</td>
                                            <td style='padding:12px 0;font-weight:600;color:#0f172a;'>$typeLabel</td>
                                        </tr>
                                        <tr>
                                            <td style='padding:12px 0;font-size:14px;color:#475569;'>Client</td>
                                            <td style='padding:12px 0;font-weight:600;color:#0f172a;'>$nomClient</td>
                                        </tr>
                                        <tr>
                                            <td style='padding:12px 0;font-size:14px;color:#475569;'>Objet</td>
                                            <td style='padding:12px 0;font-weight:600;color:#0f172a;'>{$res->getTitle()}</td>
                                        </tr>
                                    </table>
                                    <p style='margin:0 0 24px;color:#334155;'>Le client a également été informé de ce rendez-vous. Merci de vérifier les informations ou de le modifier si nécessaire.</p>
                                    <p style='margin:0;color:#475569;'>Cordialement,<br><strong>L'équipe Eray</strong></p>
                                </div>
                            </div>
                        </div>
                    ");

                try {
                    $this->mailer->send($emailAuCreateur);
                    $createursEnvoyes++;
                    $io->writeln("   Email créateur envoyé à : $creatorEmail");
                } catch (\Exception $e) {
                    $io->warning("   Erreur email créateur ($creatorName) : " . $e->getMessage());
                }

            } else {
                $io->writeln("  ⏭️  Email créateur ignoré : "
                    . ($creator === null
                        ? "getCreatedBy() est NULL (champ non renseigné en base ?)"
                        : "adresse absente ou invalide ($creatorEmail)")
                );
            }
        }

        $listeHtmlAdmin .= "</ul>";

        // ── Email récapitulatif → Admin ───────────────────────────────────
        $io->section("Envoi du récapitulatif admin");

        $emailAdmin = (new Email())
            ->from($adminEmail)
            ->to($adminEmail)
            ->subject("Planning de demain ($tomorrowStr)")
            ->html("
            <div style='font-family:Arial,sans-serif;background:#f1f5f9;padding:30px;'>

                <div style='max-width:680px;margin:auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;'>

                    <!-- HEADER -->
                    <div style='background:#1d4ed8;color:#fff;padding:26px 30px;'>
                        <h1 style='margin:0;font-size:22px;'>Rapport des rappels automatiques</h1>
                        <p style='margin:6px 0 0;opacity:0.9;'>Planning du $tomorrowStr</p>
                    </div>

                    <!-- BODY -->
                    <div style='padding:26px 30px;'>

                        <!-- STATS -->
                        <div style='display:flex;gap:12px;margin-bottom:22px;'>

                            <div style='flex:1;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;padding:14px;'>
                                <p style='margin:0;font-size:13px;color:#475569;'>Clients notifiés</p>
                                <p style='margin:6px 0 0;font-size:20px;font-weight:bold;color:#1d4ed8;'>$clientsEnvoyes</p>
                            </div>

                            <div style='flex:1;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:12px;padding:14px;'>
                                <p style='margin:0;font-size:13px;color:#475569;'> Créateurs notifiés</p>
                                <p style='margin:6px 0 0;font-size:20px;font-weight:bold;color:#059669;'>$createursEnvoyes</p>
                            </div>

                        </div>

                        <!-- SECTION TITLE -->
                        <h3 style='margin:0 0 12px;color:#0f172a;'> Détail des rendez-vous</h3>

                        <!-- LIST -->
                        <div style='font-size:14px;color:#475569;'>
                            $listeHtmlAdmin
                        </div>

                    </div>

                    <!-- FOOTER -->
                    <div style='padding:18px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#64748b;'>
                        Généré automatiquement par le système Eray • Ne pas répondre
                    </div>

                </div>
            </div>
            ");

        try {
            $this->mailer->send($emailAdmin);
            $io->success("Récapitulatif admin envoyé ($clientsEnvoyes clients, $createursEnvoyes créateurs informés).");
        } catch (\Exception $e) {
            $io->error("Erreur envoi récapitulatif admin : " . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}