<?php

namespace App\Entity;

use App\Enum\ProspectionStatut;
use App\Repository\DealRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use App\Entity\User;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: DealRepository::class)]
class Deal
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['getDeals', 'getClients'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Client::class, inversedBy: 'deals', cascade: ['persist'])]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['getDeals'])]
    private ?Client $client = null;

    #[ORM\Column(length: 255)]
    #[Groups(['getDeals', 'getClients'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['getDeals'])]
    private ?string $amount = null;

    #[ORM\Column(length: 255)]
    #[Groups(['getDeals'])]
    private ?ProspectionStatut $stage = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['getDeals'])]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['getDeals'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::FLOAT, nullable: true)]
    #[Groups(['getDeals'])]
    private ?float $probability = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['getDeals'])]
    private ?\DateTimeInterface $expectedCloseDate = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['getDeals'])]
    private ?string $assignedTo = null;

    #[ORM\ManyToOne(inversedBy: 'deals')]
    #[Groups(['getDeals'])]
    private ?User $createdBy = null;

    #[ORM\OneToMany(mappedBy: 'deal', targetEntity: Projet::class)]
    private Collection $projets;

    // --- GETTERS & SETTERS ---

    public function __construct()
    {
        $this->projets = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getAmount(): ?string
    {
        return $this->amount;
    }

   public function setAmount(?string $amount): self 
    {
        $this->amount = $amount;
        return $this;
    }

    public function getStage(): ?ProspectionStatut
    {
        return $this->stage;
    }

    public function setStage(ProspectionStatut $stage): static
    {
        $this->stage = $stage;
        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): static
    {
        $this->date = $date;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getProbability(): ?float
    {
        return $this->probability;
    }

    public function setProbability(?float $probability): static
    {
        $this->probability = $probability;
        return $this;
    }

    public function getExpectedCloseDate(): ?\DateTimeInterface
    {
        return $this->expectedCloseDate;
    }

    public function setExpectedCloseDate(?\DateTimeInterface $expectedCloseDate): static
    {
        $this->expectedCloseDate = $expectedCloseDate;
        return $this;
    }

    public function getAssignedTo(): ?string
    {
        return $this->assignedTo;
    }

    public function setAssignedTo(?string $assignedTo): static
    {
        $this->assignedTo = $assignedTo;
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

    /**
     * @return Collection<int, Projet>
     */
    public function getProjets(): Collection
    {
        return $this->projets;
    }

    public function addProjet(Projet $projet): static
    {
        if (!$this->projets->contains($projet)) {
            $this->projets->add($projet);
            $projet->setDeal($this);
        }

        return $this;
    }

    public function removeProjet(Projet $projet): static
    {
        if ($this->projets->removeElement($projet)) {
            if ($projet->getDeal() === $this) {
                $projet->setDeal(null);
            }
        }

        return $this;
    }
        
}