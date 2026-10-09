<?php

namespace App\Entity;

use App\Enum\ProjetStatut;
use App\Enum\PrioriteStatut;
use App\Repository\ProjetRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use App\Entity\User;
use App\Entity\Deal;

#[ORM\Entity(repositoryClass: ProjetRepository::class)]
class Projet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['getProjets', 'getReservations', 'getClients'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['getProjets', 'getReservations', 'getClients'])]
    private ?string $nom = null;


    #[ORM\Column(length: 255)]
    #[Groups(['getProjets'])]
    private ?ProjetStatut $statut = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['getProjets'])]
    private ?\DateTime $date_debut = null;

    #[ORM\ManyToOne(inversedBy: 'projets')]
    #[Groups(['getProjets'])]
    private ?Client $client = null;

    /**
     * @var Collection<int, Reservation>
     */
    #[ORM\OneToMany(targetEntity: Reservation::class, mappedBy: 'projet', cascade: ['remove'])]
    #[Groups(['getProjets'])]
    private Collection $reservations;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['getProjets'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::FLOAT)]
    #[Groups(['getProjets'])]
    private ?float $progress = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['getProjets'])]
    private ?\DateTime $date_fin = null;

    #[ORM\Column(length: 255)]
    #[Groups(['getProjets'])]
    private ?PrioriteStatut $priorite = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    #[Groups(['getProjets'])]
    private ?float $budget = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['getProjets'])]
    private ?string $equipe = null;

    #[ORM\ManyToOne(inversedBy: 'projets')]
    #[Groups(['getProjets'])]
    private ?User $createdBy = null;

    #[ORM\ManyToOne(inversedBy: 'projets')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['getProjets'])]
    private ?Deal $deal = null;

    public function __construct()
    {
        $this->reservations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = $nom;

        return $this;
    }

    

    public function getStatut(): ?ProjetStatut
    {
        return $this->statut;
    }

    public function setStatut(ProjetStatut $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getDateDebut(): ?\DateTime
    {
        return $this->date_debut;
    }

    public function setDateDebut(\DateTime $date_debut): static
    {
        $this->date_debut = $date_debut;

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

    /**
     * @return Collection<int, Reservation>
     */
    public function getReservations(): Collection
    {
        return $this->reservations;
    }

    public function addReservation(Reservation $reservation): static
    {
        if (!$this->reservations->contains($reservation)) {
            $this->reservations->add($reservation);
            $reservation->setProjet($this);
        }

        return $this;
    }

    public function removeReservation(Reservation $reservation): static
    {
        if ($this->reservations->removeElement($reservation)) {
            // set the owning side to null (unless already changed)
            if ($reservation->getProjet() === $this) {
                $reservation->setProjet(null);
            }
        }

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

    public function getProgress(): ?float
    {
        return $this->progress;
    }

    public function setProgress(float $progress): static
    {
        $this->progress = $progress;
        return $this;
    }

    public function getDateFin(): ?\DateTime
    {
        return $this->date_fin;
    }

    public function setDateFin(?\DateTime $date_fin): static
    {
        $this->date_fin = $date_fin;

        return $this;
    }

    public function getPriorite(): ?PrioriteStatut
    {
        return $this->priorite;
    }

    public function setPriorite(PrioriteStatut $priorite): static
    {
        $this->priorite = $priorite;

        return $this;
    }

    public function getBudget(): ?float
    {
        return $this->budget;
    }

    public function setBudget(?float $budget): static
    {
        $this->budget = $budget;
        return $this;
    }

    public function getEquipe(): ?string
    {
        return $this->equipe;
    }

    public function setEquipe(?string $equipe): static
    {
        $this->equipe = $equipe;

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

    public function getDeal(): ?Deal
    {
        return $this->deal;
    }

    public function setDeal(?Deal $deal): static
    {
        $this->deal = $deal;

        return $this;
    }
}
