<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

class EntityDetailSwitchLanguageMessage
{
    /**
     * @var string
     */
    private $entityName;

    /**
     * @var array|string[]
     */
    private $ids;

    /**
     * @var string
     */
    private $currentLanguage;

    /**
     * @var string
     */
    private $newLanguage;

    public function __construct(string $entityName, array $ids, string $currentLanguage, string $newLanguage)
    {
        $this->entityName = $entityName;
        $this->ids = $ids;
        $this->currentLanguage = $currentLanguage;
        $this->newLanguage = $newLanguage;
    }

    public function getEntityName(): string
    {
        return $this->entityName;
    }

    public function setEntityName(string $entityName): self
    {
        $this->entityName = $entityName;

        return $this;
    }

    /**
     * @return array|string[]
     */
    public function getIds(): array
    {
        return $this->ids;
    }

    public function setIds(array $ids): self
    {
        $this->ids = $ids;

        return $this;
    }

    public function getCurrentLanguage(): string
    {
        return $this->currentLanguage;
    }

    public function setCurrentLanguage(string $currentLanguage): self
    {
        $this->currentLanguage = $currentLanguage;

        return $this;
    }

    public function getNewLanguage(): string
    {
        return $this->newLanguage;
    }

    public function setNewLanguage(string $newLanguage): self
    {
        $this->newLanguage = $newLanguage;

        return $this;
    }
}
