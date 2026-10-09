<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260330220631 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE projet ADD description LONGTEXT NOT NULL, ADD progress DOUBLE PRECISION NOT NULL, ADD date_fin DATETIME DEFAULT NULL, ADD budget DOUBLE PRECISION DEFAULT NULL, ADD equipe VARCHAR(255) DEFAULT NULL, CHANGE type priorite VARCHAR(255) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE projet DROP description, DROP progress, DROP date_fin, DROP budget, DROP equipe, CHANGE priorite type VARCHAR(255) NOT NULL');
    }
}
