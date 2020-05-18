<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

use Shopware\Core\Framework\DataAbstractionLayer\DefinitionInstanceRegistry;
use Shopware\Core\Framework\DataAbstractionLayer\EntityTranslationDefinition;

class EntitySwitchLanguageMessageGenerator
{
    /**
     * @var DefinitionInstanceRegistry
     */
    private $definitions;

    public function __construct(DefinitionInstanceRegistry $definitions)
    {
        $this->definitions = $definitions;
    }

    /**
     * @return iterable|EntitySwitchLanguageMessage[]
     */
    public function generate(string $oldLanguageId, string $newLanguageId): iterable
    {
        foreach ($this->definitions->getDefinitions() as $definition) {
            $translation = $definition->getTranslationDefinition();

            if ($translation instanceof EntityTranslationDefinition) {
                yield new EntitySwitchLanguageMessage($definition->getEntityName(), $oldLanguageId, $newLanguageId);
            }
        }
    }
}
