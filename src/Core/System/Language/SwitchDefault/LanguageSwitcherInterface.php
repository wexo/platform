<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\SwitchDefault;

interface LanguageSwitcherInterface
{
    public function switch(string $entityName, array $ids, string $oldLanguageId, string $newLanguageId): void;
}
