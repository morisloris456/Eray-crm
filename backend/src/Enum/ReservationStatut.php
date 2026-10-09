<?php

namespace App\Enum;

enum ReservationStatut: string
{
    case Planifie = 'planifie';
    case EnCours = 'en_cours';
    case Termine = 'termine';
    case Annule = 'annule';
    
    public function getLabel(): string
    {
        return match ($this) {
            self::Planifie => 'planifie',
            self::EnCours => 'en_cours',
            self::Termine => 'termine',
            self::Annule => 'annule',
        };
    }
}