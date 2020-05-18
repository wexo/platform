<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

use Shopware\Core\Framework\DataAbstractionLayer\Dbal\Common\IteratorFactory;
use Shopware\Core\Framework\DataAbstractionLayer\DefinitionInstanceRegistry;

class EntityDetailSwitchLanguageMessageGenerator
{
    /**
     * @var DefinitionInstanceRegistry
     */
    private $definitions;

    /**
     * @var IteratorFactory
     */
    private $iteratorFactory;

    public function __construct(DefinitionInstanceRegistry $definitions, IteratorFactory $iteratorFactory)
    {
        $this->definitions = $definitions;
        $this->iteratorFactory = $iteratorFactory;
    }

    /**
     * @return iterable|EntityDetailSwitchLanguageMessage[]
     */
    public function generate(string $entityName, string $oldLanguageId, string $newLanguageId): iterable
    {
        $definition = $this->definitions->getByEntityName($entityName);
        $iterator = $this->iteratorFactory->createIterator($definition);

        while (count($ids = $iterator->fetch()) > 0) {
            yield new EntityDetailSwitchLanguageMessage($entityName, $ids, $oldLanguageId, $newLanguageId);
        }
    }
}
