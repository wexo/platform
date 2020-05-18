<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

use Symfony\Component\Messenger\MessageBusInterface;

class LanguageDefaultSwitchInvoker
{
    /**
     * @var MessageBusInterface
     */
    private $messageBus;

    /**
     * @var LanguageSwitcherInterface
     */
    private $languageSwitcher;

    /**
     * @var EntitySwitchLanguageMessageGenerator
     */
    private $entitySwitchGenerator;

    public function __construct(
        MessageBusInterface $messageBus,
        LanguageSwitcherInterface $languageSwitcher,
        EntitySwitchLanguageMessageGenerator $entitySwitchGenerator
    ) {
        $this->messageBus = $messageBus;
        $this->languageSwitcher = $languageSwitcher;
        $this->entitySwitchGenerator = $entitySwitchGenerator;
    }

    public function invokeLanguageSwitch(string $oldLanguageId, string $newLanguageId): void
    {
        $this->languageSwitcher->switchLanguage($oldLanguageId, $newLanguageId);

        foreach ($this->entitySwitchGenerator->generate($oldLanguageId, $newLanguageId) as $message) {
            $this->messageBus->dispatch($message);
        }
    }
}
