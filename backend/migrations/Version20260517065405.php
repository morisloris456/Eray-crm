<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260517065405 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE client ADD created_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE client ADD CONSTRAINT FK_C7440455B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_C7440455B03A8386 ON client (created_by_id)');
        $this->addSql('ALTER TABLE deal ADD created_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE deal ADD CONSTRAINT FK_E3FEC116B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_E3FEC116B03A8386 ON deal (created_by_id)');
        $this->addSql('ALTER TABLE projet ADD created_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE projet ADD CONSTRAINT FK_50159CA9B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_50159CA9B03A8386 ON projet (created_by_id)');
        $this->addSql('ALTER TABLE reservation ADD created_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE reservation ADD CONSTRAINT FK_42C84955B03A8386 FOREIGN KEY (created_by_id) REFERENCES user (id)');
        $this->addSql('CREATE INDEX IDX_42C84955B03A8386 ON reservation (created_by_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE client DROP FOREIGN KEY FK_C7440455B03A8386');
        $this->addSql('DROP INDEX IDX_C7440455B03A8386 ON client');
        $this->addSql('ALTER TABLE client DROP created_by_id');
        $this->addSql('ALTER TABLE deal DROP FOREIGN KEY FK_E3FEC116B03A8386');
        $this->addSql('DROP INDEX IDX_E3FEC116B03A8386 ON deal');
        $this->addSql('ALTER TABLE deal DROP created_by_id');
        $this->addSql('ALTER TABLE projet DROP FOREIGN KEY FK_50159CA9B03A8386');
        $this->addSql('DROP INDEX IDX_50159CA9B03A8386 ON projet');
        $this->addSql('ALTER TABLE projet DROP created_by_id');
        $this->addSql('ALTER TABLE reservation DROP FOREIGN KEY FK_42C84955B03A8386');
        $this->addSql('DROP INDEX IDX_42C84955B03A8386 ON reservation');
        $this->addSql('ALTER TABLE reservation DROP created_by_id');
    }
}
