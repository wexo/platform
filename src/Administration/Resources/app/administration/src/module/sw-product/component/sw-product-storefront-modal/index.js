import template from './sw-product-storefront-modal.html.twig';

const { Component } = Shopware;
const { Criteria } = Shopware.Data;
const { mapState } = Shopware.Component.getComponentHelper();

Component.register('sw-product-storefront-modal', {
    template,

    inject: [
        'repositoryFactory'
    ],

    data() {
        return {
            active: false,
            salesChannelId: null,
            domainId: null,
        }
    },

    methods: {
        openContent() {
            if (this.product.visibilities.length === 1) {
                this.salesChannelId = this.product.visibilities.first().salesChannelId;
            }

            this.active = true;
        },

        navigateDomain(entityName, entity) {
            let location = `detail/${this.product.id}`;

            const seoUrl = this.product.seoUrls.filter(value => {
                return value.salesChannelId === this.salesChannelId;
            });

            if (seoUrl.length) {
                location = seoUrl.first().seoPathInfo;
            }

            window.open(`${entity.url}/${location}`, '_blank');
            this.$emit('modal-close');
        },

        onCloseModal() {
            this.salesChannelId = null;
            this.domainId = null;
            this.active = false;
        }
    },

    computed: {
        ...mapState('swProductDetail', [
            'product',
        ]),

        salesChannelCriteria() {
            const criteria = new Criteria();

            const salesChannelIds = this.product.visibilities.reduce((accumulator, visibility) => {
                accumulator.push(visibility.salesChannelId);
                return accumulator;
            }, []);

            criteria.addFilter(
                Criteria.equalsAny('id', salesChannelIds)
            );
            return criteria;
        },

        domainCriteria() {
            const criteria = new Criteria();

            criteria.addFilter(
                Criteria.equals('salesChannelId', this.salesChannelId)
            );

            return criteria;
        },

        modalTitle() {
            return this.salesChannelId ? 'Choose Domain' : 'Choose Sales Channel';
        },
    }
});
