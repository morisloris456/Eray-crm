<?php

namespace App\Enum;

enum PrioriteStatut: string
{
    case Basse = 'basse';
    case Moyenne = 'moyenne';
    case Haute = 'haute';
    case Critique = 'critique';

    public function getLabel(): string
    {
        return match ($this) {
            self::Basse => 'basse',
            self::Moyenne => 'moyenne',
            self::Haute => 'haute',
            self::Critique => 'critique',
        };
    }
}