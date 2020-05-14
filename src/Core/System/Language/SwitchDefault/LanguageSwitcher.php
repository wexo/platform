<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

use Shopware\Core\Framework\DataAbstractionLayer\DefinitionInstanceRegistry;

class LanguageSwitcher implements LanguageSwitcherInterface
{
    /**
     * @var DefinitionInstanceRegistry
     */
    private $definitions;

    public function __construct(DefinitionInstanceRegistry $definitions)
    {
        $this->definitions = $definitions;
    }

    public function switch(string $entityName, array $ids, string $oldLanguageId, string $newLanguageId): void
    {
        $repository = $this->definitions->getRepository($entityName);
    }
}
