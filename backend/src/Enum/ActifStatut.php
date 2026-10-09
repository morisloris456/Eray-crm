<?php

namespace App\Enum;

enum ActifStatut: string
{
    case Actif = 'actif';
    case Inactif = 'inactif';
    case Prospect = 'prospect';
    case Ancien = 'ancien';

    public function getLabel(): string
    {
        return match ($this) {
            self::Actif => 'actif',
            self::Inactif => 'inactif',
            self::Prospect => 'prospect',
            self::Ancien => 'ancien',
        };
    }
}