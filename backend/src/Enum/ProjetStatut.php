<?php

namespace App\Enum;

enum ProjetStatut: string
{
    case EnCours = 'en_cours';
    case EnAttente = 'en_attente';
    case Termine = 'termine';
    case Archive = 'archive';

    public function getLabel(): string
    {
        return match ($this) {
            self::EnCours => 'en_cours',
            self::EnAttente => 'en_attente',
            self::Termine => 'termine',
            self::Archive => 'archive',
        };
    }
}