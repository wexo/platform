<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

use Shopware\Core\Framework\DataAbstractionLayer\Dbal\Common\IteratorFactory;
use Shopware\Core\Framework\DataAbstractionLayer\DefinitionInstanceRegistry;
use Shopware\Core\Framework\MessageQueue\Handler\AbstractMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

class EntitySwitchLanguageHandler extends AbstractMessageHandler
{
    /**
     * @var DefinitionInstanceRegistry
     */
    private $definitions;

    /**
     * @var MessageBusInterface
     */
    private $messageBus;

    /**
     * @var IteratorFactory
     */
    private $iteratorFactory;

    public function __construct(
        DefinitionInstanceRegistry $definitions,
        MessageBusInterface $messageBus,
        IteratorFactory $iteratorFactory
    ) {
        $this->definitions = $definitions;
        $this->messageBus = $messageBus;
        $this->iteratorFactory = $iteratorFactory;
    }

    public function handle($message): void
    {
        if (!$message instanceof EntitySwitchLanguageMessage) {
            return;
        }

        $definition = $this->definitions->getByEntityName($message->getEntityName());
        $iterator = $this->iteratorFactory->createIterator($definition);

        foreach ($iterator->fetch() as $ids) {
            $this->messageBus->dispatch(new EntityDetailSwitchLanguageMessage(
                $message->getEntityName(),
                $ids,
                $message->getCurrentLanguage(),
                $message->getNewLanguage()
            ));
        }
    }

    public static function getHandledMessages(): iterable
    {
        yield EntitySwitchLanguageMessage::class;
    }
}
