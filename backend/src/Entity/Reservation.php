<?php

namespace App\Entity;

use App\Enum\InteractionType;
use App\Enum\ReservationStatut;
use App\Repository\ReservationRepository;
use BcMath\Number;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use App\Entity\User;

#[ORM\Entity(repositoryClass: ReservationRepository::class)]
class Reservation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['getReservations', 'getClients', 'getProjets'])]
    private ?int $id = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['getReservations'])]
    private ?\DateTime $date = null;

    #[ORM\Column(length: 255)]
    #[Groups(['getReservations'])]
    private ?string $lieu = null;

    #[ORM\Column(length: 255)]
    #[Groups(['getReservations'])]
    private ?InteractionType $type = null;

    #[ORM\Column(length: 255)]
    #[Groups(['getReservations'])]
    private ?string $description = null;

    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['getReservations'])]
    private ?Client $client = null;

    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    #[Groups(['getReservations'])]
    private ?Projet $projet = null;

    #[ORM\Column(type: Types::TIME_MUTABLE)]
    #[Groups(['getReservations'])]
    private ?\DateTime $time = null;

    #[ORM\Column(length: 255)]
    #[Groups(['getReservations'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['getReservations'])]
    private ?int $duree = null;

    #[ORM\Column(length: 255)]
    #[Groups(['getReservations'])]
    private ?ReservationStatut $statut = null;

    #[ORM\ManyToOne(inversedBy: 'reservations')]
    #[Groups(['getReservations'])]
    private ?User $createdBy = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDate(): ?\DateTime
    {
        return $this->date;
    }

    public function setDate(\DateTime $date): static
    {
        $this->date = $date;

        return $this;
    }

    public function getLieu(): ?string
    {
        return $this->lieu;
    }

    public function setLieu(string $lieu): static
    {
        $this->lieu = $lieu;

        return $this;
    }

    public function getType(): ?InteractionType
    {
        return $this->type;
    }

    public function setType(InteractionType $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getClient(): ?Client
    {
        return $this->client;
    }

    public function setClient(?Client $client): static
    {
        $this->client = $client;

        return $this;
    }

    public function getProjet(): ?Projet
    {
        return $this->projet;
    }

    public function setProjet(?Projet $projet): static
    {
        $this->projet = $projet;

        return $this;
    }

    public function getTime(): ?\DateTime
    {
        return $this->time;
    }

    public function setTime(\DateTime $time): static
    {
        $this->time = $time;

        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getDuree(): ?int
    {
        return $this->duree;
    }

    public function setDuree(?int $duree): static
    {
        $this->duree = $duree;
        return $this;
    }

    public function getStatut(): ?ReservationStatut
    {
        return $this->statut;
    }

    public function setStatut(ReservationStatut $statut): static
    {
        $this->statut = $statut;

        return $this;
    }
    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;

        return $this;
    }
}
