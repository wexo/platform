<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\DefinitionInstanceRegistry;
use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Field;
use Shopware\Core\Framework\DataAbstractionLayer\Field\TranslationsAssociationField;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\Struct\ArrayEntity;
use Shopware\Core\Framework\Uuid\Uuid;

class LanguageSwitcher implements LanguageSwitcherInterface
{
    /**
     * @var DefinitionInstanceRegistry
     */
    private $definitions;

    /**
     * @var Connection
     */
    private $connection;

    public function __construct(DefinitionInstanceRegistry $definitions, Connection $connection)
    {
        $this->definitions = $definitions;
        $this->connection = $connection;
    }

    public function switchTranslatableEntity(string $entityName, array $ids, string $oldLanguageId, string $newLanguageId): void
    {
        $definition = $this->definitions->getByEntityName($entityName);
        $translationField = $definition->getTranslationField();

        if (!$translationField instanceof TranslationsAssociationField) {
            return;
        }

        $primaryKey = $definition->getPrimaryKeys()->first();

        if (!$primaryKey instanceof Field) {
            return;
        }

        $repository = $this->definitions->getRepository($entityName);
        $context = Context::createDefaultContext();
        $criteria = new Criteria($ids);
        $criteria->addAssociation($translationField->getPropertyName());
        $entities = $repository->search($criteria, $context)->getEntities();

        $updates = [];

        /** @var Entity $entity */
        foreach ($entities as $entity) {
            $oldData = [];
            $newData = [];
            $primaryKeyValue = null;

            if ($entity instanceof Entity) {
                $entity = new ArrayEntity($entity->jsonSerialize());
            }

            if ($entity instanceof ArrayEntity) {
                $oldData = $entity[$translationField->getPropertyName()][$oldLanguageId] ?? [];
                $newData = $entity[$translationField->getPropertyName()][$newLanguageId] ?? [];
                $primaryKeyValue = $entity[$primaryKey->getPropertyName()];
            }

            if (empty($oldData) && empty($newData)) {
                continue;
            }

            foreach ($oldData as $key => $value) {
                $newData[$key] = $newData[$key] ?? $value;
            }

            $updates[] = [
                $primaryKey->getPropertyName() => $primaryKeyValue,
                $translationField->getPropertyName() => [
                    $oldLanguageId => $newData,
                    $newLanguageId => $oldData,
                ],
            ];
        }

        if (empty($updates)) {
            $repository->update($updates, $context);
        }
    }

    public function switchLanguage(string $newLanguageId): void
    {
        $this->connection->exec('SET FOREIGN_KEY_CHECKS = 0');
        $stmt = $this->connection->prepare('UPDATE language SET id = :newId WHERE id = :oldId');

        // assign new uuid to old DEFAULT
        $stmt->execute([
            'newId' => Uuid::randomBytes(),
            'oldId' => Uuid::fromHexToBytes(Defaults::LANGUAGE_SYSTEM),
        ]);

        // change id to DEFAULT
        $stmt->execute([
            'newId' => Uuid::fromHexToBytes(Defaults::LANGUAGE_SYSTEM),
            'oldId' => $newLanguageId,
        ]);

        $this->connection->exec('SET FOREIGN_KEY_CHECKS = 1');

    }
}
