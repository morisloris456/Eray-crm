<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260330184807 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE deal (id INT AUTO_INCREMENT NOT NULL, client_id INT NOT NULL, UNIQUE INDEX UNIQ_E3FEC11619EB6921 (client_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE deal ADD CONSTRAINT FK_E3FEC11619EB6921 FOREIGN KEY (client_id) REFERENCES client (id)');
        $this->addSql('ALTER TABLE client ADD adresse VARCHAR(255) DEFAULT NULL, ADD website VARCHAR(255) DEFAULT NULL, ADD secteur VARCHAR(255) DEFAULT NULL, ADD notes LONGTEXT DEFAULT NULL, ADD created_at DATETIME NOT NULL, ADD updated_at DATETIME NOT NULL, DROP statut_prospection');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE deal DROP FOREIGN KEY FK_E3FEC11619EB6921');
        $this->addSql('DROP TABLE deal');
        $this->addSql('ALTER TABLE client ADD statut_prospection VARCHAR(255) NOT NULL, DROP adresse, DROP website, DROP secteur, DROP notes, DROP created_at, DROP updated_at');
    }
}
