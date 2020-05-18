<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\Command;

use Shopware\Core\Defaults;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepositoryInterface;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\MultiFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\NotFilter;
use Shopware\Core\System\Language\LanguageCollection;
use Shopware\Core\System\Language\LanguageEntity;
use Shopware\Core\System\Language\SwitchDefault\EntityDetailSwitchLanguageMessageGenerator;
use Shopware\Core\System\Language\SwitchDefault\EntitySwitchLanguageMessageGenerator;
use Shopware\Core\System\Language\SwitchDefault\LanguageDefaultSwitchInvoker;
use Shopware\Core\System\Language\SwitchDefault\LanguageSwitcherInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

class SwitchDefaultCommand extends Command
{
    protected static $defaultName = 'language:switch-default';

    /**
     * @var SymfonyStyle|null
     */
    private $io;

    /**
     * @var EntityRepositoryInterface
     */
    private $languages;

    /**
     * @var LanguageDefaultSwitchInvoker
     */
    private $invoker;

    /**
     * @var LanguageSwitcherInterface
     */
    private $languageSwitcher;

    /**
     * @var EntitySwitchLanguageMessageGenerator
     */
    private $entitySwitchGenerator;

    /**
     * @var EntityDetailSwitchLanguageMessageGenerator
     */
    private $entityDetailSwitchGenerator;

    public function __construct(
        EntityRepositoryInterface $languages,
        LanguageDefaultSwitchInvoker $invoker,
        LanguageSwitcherInterface $languageSwitcher,
        EntitySwitchLanguageMessageGenerator $entitySwitchGenerator,
        EntityDetailSwitchLanguageMessageGenerator $entityDetailSwitchGenerator
    ) {
        parent::__construct(null);
        $this->languages = $languages;
        $this->invoker = $invoker;
        $this->languageSwitcher = $languageSwitcher;
        $this->entitySwitchGenerator = $entitySwitchGenerator;
        $this->entityDetailSwitchGenerator = $entityDetailSwitchGenerator;
    }

    protected function configure()
    {
        $this->addArgument('language', InputArgument::OPTIONAL);
        $this->addOption('async', InputOption::VALUE_NONE);
    }

    public function run(InputInterface $input, OutputInterface $output)
    {
        $this->io = new SymfonyStyle($input, $output);
        $targetLanguage = $input->getArgument('language');
        $context = Context::createDefaultContext();
        $criteria = new Criteria();
        $criteria->addFilter(new NotFilter(NotFilter::CONNECTION_AND, [
            new EqualsFilter('id', Defaults::LANGUAGE_SYSTEM),
        ]));

        if (!empty($targetLanguage)) {
            $criteria->addFilter(new MultiFilter(MultiFilter::CONNECTION_OR, [
                new EqualsFilter('name', $targetLanguage),
                new EqualsFilter('locale.code', $targetLanguage),
            ]));
        }

        /** @var LanguageCollection $languages */
        $languages = $this->languages->search($criteria, $context)->getEntities();

        switch ($languages->count()) {
            case 0:
                $this->io->error(sprintf('Language with identifier %s not found', $targetLanguage));
                return 1;
            case 1:
                $this->switchLanguage($languages->first()->getId(), (bool) $input->getOption('async'));
                $this->io->success(sprintf('Invoke language switch process to %s', $languages->first()->getName()));
                return 0;
            default:
                $this->io->warning(sprintf('The language search found multiple language.'));
                $this->io->listing($languages->map(static function (LanguageEntity $language): string {
                    return $language->getName();
                }));
                return 2;
        }
    }

    protected function switchLanguage(string $languageId, bool $async): void
    {
        if ($async) {
            $this->invoker->invokeLanguageSwitch(Defaults::LANGUAGE_SYSTEM, $languageId);
        } else {
            $this->languageSwitcher->switchLanguage(Defaults::LANGUAGE_SYSTEM, $languageId);

            $entitySwitches = $this->entitySwitchGenerator->generate(Defaults::LANGUAGE_SYSTEM, $languageId);
            foreach ($entitySwitches as $entitySwitch) {
                $this->io->section($entitySwitch->getEntityName());
                $bar = $this->io->createProgressBar();
                $bar->start();

                $entityDetailSwitches = $this->entityDetailSwitchGenerator->generate(
                    $entitySwitch->getEntityName(),
                    $entitySwitch->getCurrentLanguage(),
                    $entitySwitch->getNewLanguage()
                );
                foreach ($entityDetailSwitches as $entityDetailSwitch) {
                    $bar->setMaxSteps($bar->getMaxSteps() + count($entityDetailSwitch->getIds()));

                    $this->languageSwitcher->switchTranslatableEntity(
                        $entityDetailSwitch->getEntityName(),
                        $entityDetailSwitch->getIds(),
                        $entityDetailSwitch->getCurrentLanguage(),
                        $entityDetailSwitch->getNewLanguage()
                    );

                    $bar->advance(count($entityDetailSwitch->getIds()));
                }

                $bar->finish();
            }
        }
    }
}
