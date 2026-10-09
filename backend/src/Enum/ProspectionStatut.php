<?php

namespace App\Enum;

enum ProspectionStatut: string
{
    case Lead = 'lead';
    case Contact = 'contact';
    case Proposal = 'proposal';
    case Won = 'won';
    case Lost = 'lost';
    
    public function getLabel(): string
    {
        return match ($this) {
            self::Lead => 'lead',
            self::Contact => 'contact',
            self::Proposal => 'proposal',
            self::Won => 'won',
            self::Lost => 'lost',
        };
    }
}