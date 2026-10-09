<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260330195111 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE deal ADD title VARCHAR(255) NOT NULL, ADD amount NUMERIC(10, 2) NOT NULL, ADD stage VARCHAR(255) NOT NULL, ADD date DATE NOT NULL, ADD description LONGTEXT DEFAULT NULL, ADD probability DOUBLE PRECISION DEFAULT NULL, ADD expected_close_date DATE DEFAULT NULL, ADD assigned_to VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE deal DROP title, DROP amount, DROP stage, DROP date, DROP description, DROP probability, DROP expected_close_date, DROP assigned_to');
    }
}
