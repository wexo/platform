<?php declare(strict_types=1);

namespace Shopware\Core\Checkout\Order\SalesChannel;

use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

/**
 * This route is used to load the orders of the logged-in customer
 * With this route it is also possible to send the standard API parameters such as: 'page', 'limit', 'filter', etc.
 */
abstract class AbstractOrderRoute
{
    abstract public function getDecorated(): AbstractOrderRoute;

    /**
     * @deprecated tag:v6.4.0 - Parameter $criteria will be mandatory in future implementation
     */
    abstract public function load(Request $request, SalesChannelContext $context/* Criteria $criteria*/): OrderRouteResponse;
}
