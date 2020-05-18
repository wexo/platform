<?php declare(strict_types=1);

namespace Shopware\Core\System\Language\Api;

use Shopware\Core\Defaults;
use Shopware\Core\Framework\Routing\Annotation\RouteScope;
use Shopware\Core\System\Language\SwitchDefault\LanguageDefaultSwitchInvoker;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * @RouteScope(scopes={"api"})
 */
class LanguageDefaultSwitcherActionController extends AbstractController
{
    /**
     * @var LanguageDefaultSwitchInvoker
     */
    private $invoker;

    public function __construct(LanguageDefaultSwitchInvoker $invoker)
    {
        $this->invoker = $invoker;
    }

    /**
     * @Route("/api/v{version}/_action/language-default/switch/{languageId}", name="api.action.language-default.switch", methods={"POST"})
     */
    public function switchDefaultLanguage(string $languageId): JsonResponse
    {
        $this->invoker->invokeLanguageSwitch(Defaults::LANGUAGE_SYSTEM, $languageId);

        return new JsonResponse([
            'success' => true,
        ], Response::HTTP_CREATED);
    }
}
