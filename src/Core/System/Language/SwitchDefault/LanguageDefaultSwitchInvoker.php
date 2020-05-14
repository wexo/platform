<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

use Shopware\Core\Defaults;
use Shopware\Core\Framework\DataAbstractionLayer\DefinitionInstanceRegistry;
use Shopware\Core\Framework\DataAbstractionLayer\EntityTranslationDefinition;
use Symfony\Component\Messenger\MessageBusInterface;

class LanguageDefaultSwitchInvoker
{
    /**
     * @var DefinitionInstanceRegistry
     */
    private $definitions;

    /**
     * @var MessageBusInterface
     */
    private $messageBus;

    public function __construct(DefinitionInstanceRegistry $definitions, MessageBusInterface $messageBus)
    {
        $this->definitions = $definitions;
        $this->messageBus = $messageBus;
    }

    public function invokeLanguageSwitch(string $languageId): void
    {
        foreach ($this->definitions->getDefinitions() as $definition) {
            $translation = $definition->getTranslationDefinition();

            if ($translation instanceof EntityTranslationDefinition) {
                $this->messageBus->dispatch(new EntitySwitchLanguageMessage(
                    $translation->getEntityName(),
                    Defaults::LANGUAGE_SYSTEM,
                    $languageId
                ));
            }
        }
    }
}
