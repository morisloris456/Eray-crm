<?php

namespace App\Enum;

enum InteractionType: string
{
    case Appel = 'Appel';
    case Reunion = 'Réunion';
    case Presentiel = 'Présentiel';
    
    public function getLabel(): string
    {
        return match ($this) {
            self::Appel => 'Appel',
            self::Reunion => 'Réunion',
            self::Presentiel => 'Présentiel',
        };
    }
}