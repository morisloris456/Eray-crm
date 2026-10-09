<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260330213916 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservation ADD time TIME NOT NULL, ADD title VARCHAR(255) NOT NULL, ADD duree DOUBLE PRECISION DEFAULT NULL, ADD statut VARCHAR(255) NOT NULL, ADD projet_id INT DEFAULT NULL, CHANGE canal type VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE reservation ADD CONSTRAINT FK_42C84955C18272 FOREIGN KEY (projet_id) REFERENCES projet (id)');
        $this->addSql('CREATE INDEX IDX_42C84955C18272 ON reservation (projet_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reservation DROP FOREIGN KEY FK_42C84955C18272');
        $this->addSql('DROP INDEX IDX_42C84955C18272 ON reservation');
        $this->addSql('ALTER TABLE reservation ADD canal VARCHAR(255) NOT NULL, DROP type, DROP time, DROP title, DROP duree, DROP statut, DROP projet_id');
    }
}
