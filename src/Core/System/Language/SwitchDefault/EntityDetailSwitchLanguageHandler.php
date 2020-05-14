<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

use Shopware\Core\Framework\MessageQueue\Handler\AbstractMessageHandler;

class EntityDetailSwitchLanguageHandler extends AbstractMessageHandler
{
    /**
     * @var LanguageSwitcherInterface
     */
    private $languageSwitcher;

    public function __construct(LanguageSwitcherInterface $languageSwitcher)
    {
        $this->languageSwitcher = $languageSwitcher;
    }

    public function handle($message): void
    {
        if (!$message instanceof EntityDetailSwitchLanguageMessage) {
            return;
        }

        $this->languageSwitcher->switch(
            $message->getEntityName(),
            $message->getIds(),
            $message->getCurrentLanguage(),
            $message->getNewLanguage()
        );
    }

    public static function getHandledMessages(): iterable
    {
        yield EntityDetailSwitchLanguageMessage::class;
    }
}
