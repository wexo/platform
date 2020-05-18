<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

use Shopware\Core\Framework\MessageQueue\Handler\AbstractMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

class EntitySwitchLanguageHandler extends AbstractMessageHandler
{
    /**
     * @var MessageBusInterface
     */
    private $messageBus;

    /**
     * @var EntityDetailSwitchLanguageMessageGenerator
     */
    private $messageGenerator;

    public function __construct(
        MessageBusInterface $messageBus,
        EntityDetailSwitchLanguageMessageGenerator $messageGenerator
    ) {
        $this->messageBus = $messageBus;
        $this->messageGenerator = $messageGenerator;
    }

    public function handle($message): void
    {
        if (!$message instanceof EntitySwitchLanguageMessage) {
            return;
        }

        $generator = $this->messageGenerator->generate(
            $message->getEntityName(),
            $message->getCurrentLanguage(),
            $message->getNewLanguage()
        );

        foreach ($generator as $subMessage) {
            $this->messageBus->dispatch($subMessage);
        }
    }

    public static function getHandledMessages(): iterable
    {
        yield EntitySwitchLanguageMessage::class;
    }
}
