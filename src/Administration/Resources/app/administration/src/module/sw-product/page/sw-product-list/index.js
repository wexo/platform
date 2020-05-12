import template from './sw-product-list.twig';
import './sw-product-list.scss';

const { Component, Mixin } = Shopware;
const { Criteria } = Shopware.Data;
const activeInactiveOptions = {
    active: "active",
    inactive: "inactive"
}

Component.register('sw-product-list', {
    template,

    inject: ['repositoryFactory', 'numberRangeService'],

    mixins: [
        Mixin.getByName('notification'),
        Mixin.getByName('listing'),
        Mixin.getByName('placeholder')
    ],

    data() {
        return {
            products: null,
            currencies: [],
            sortBy: 'productNumber',
            sortDirection: 'DESC',
            naturalSorting: true,
            isLoading: false,
            isBulkLoading: false,
            total: 0,
            filter: {
                activeInactive: "",
                selectedManufacturers: [],
                productNumber: "",
                price: {
                    from: null,
                    to: null
                },
                stock: {
                    from: null,
                    to: null
                },
                missingCover: false,
                salesChannel: "",
                showAllProductVariants: false,
                clearanceSale: false,
            },
            manufacturers: [],
            salesChannels: [],
            activeInactiveOptions: [
                {
                    name: "Active",
                    value: activeInactiveOptions.active
                },
                {
                    name: "Inactive",
                    value: activeInactiveOptions.inactive
                }
            ]
        };
    },

    watch: {
        filter: {
            handler(){
                this.getList();
            },
            deep: true
        }
    },

    created() {
        this.getManufacturerList();
        this.getSalesChannelList();
    },

    metaInfo() {
        return {
            title: this.$createTitle()
        };
    },

    computed: {
        productRepository() {
            return this.repositoryFactory.create('product');
        },

        productColumns() {
            return this.getProductColumns();
        },

        currencyRepository() {
            return this.repositoryFactory.create('currency');
        },

        currenciesColumns() {
            return this.currencies.sort((a, b) => {
                return b.isSystemDefault ? 1 : -1;
            }).map(item => {
                return {
                    property: `price-${item.isoCode}`,
                    dataIndex: `price-${item.id}`,
                    label: `${item.name}`,
                    routerLink: 'sw.product.detail',
                    allowResize: true,
                    visible: item.isSystemDefault,
                    align: 'right'
                };
            });
        },

        manufacturerRepository() {
            return this.repositoryFactory.create('product_manufacturer');
        },

        salesChannelRepository() {
            return this.repositoryFactory.create('sales_channel');
        }
    },

    filters: {
        stockColorVariant(value) {
            if (value > 25) {
                return 'success';
            }
            if (value < 25 && value > 0) {
                return 'warning';
            }

            return 'error';
        }
    },

    methods: {
        updateProductNumberFilter(productNumber) {
            this.filter.productNumber = productNumber;
        },

        getList() {
            this.isLoading = true;

            let productCriteria = new Criteria(this.page, this.limit);
            this.naturalSorting = this.sortBy === 'productNumber';

            productCriteria.setTerm(this.term);
            if (!this.filter.showAllProductVariants) {
                productCriteria.addFilter(Criteria.equals('product.parentId', null));
            }
            productCriteria.addSorting(Criteria.sort(this.sortBy, this.sortDirection, this.naturalSorting));
            productCriteria.addAssociation('cover');
            productCriteria.addAssociation('manufacturer');
            productCriteria.addAssociation('visibilities');

            productCriteria = this.addFilters(productCriteria);

            const currencyCriteria = new Criteria(1, 500);

            return Promise.all([
                this.productRepository.search(productCriteria, Shopware.Context.api),
                this.currencyRepository.search(currencyCriteria, Shopware.Context.api)
            ]).then((result) => {
                const products = result[0];
                const currencies = result[1];

                if (this.filter.showAllProductVariants) {
                    const parentRequestPromises = [];
                    for (let product of products) {
                        if (product.parentId) {
                            const criteria = new Criteria();
                            criteria.addFilter(Criteria.equals('id', product.parentId))
                            criteria.addAssociation('manufacturer');
                            parentRequestPromises.push(this.productRepository.search(criteria, Shopware.Context.api).then((response) => {
                                const parentProduct = response.get(product.parentId);

                                if (!product.name) {
                                    product.name = parentProduct.name;
                                }
                                if (!product.price) {
                                    product.price = parentProduct.price;
                                }
                                if (!product.manufacturer) {
                                    product.manufacturer = parentProduct.manufacturer;
                                }
                            }))
                        }
                        Promise.all(parentRequestPromises).then(() => {
                            this.total = products.total;
                            this.products = products;

                            this.currencies = currencies;
                            this.isLoading = false;
                            this.selection = {};
                        })
                    }
                } else {
                    this.total = products.total;
                    this.products = products;

                    this.currencies = currencies;
                    this.isLoading = false;
                    this.selection = {};
                }
            }).catch(() => {
                this.isLoading = false;
            });
        },

        addFilters(productCriteria) {
            if (this.filter.activeInactive) {
                const showActiveProducts = this.filter.activeInactive === activeInactiveOptions.active;
                productCriteria.addFilter(Criteria.equals('product.active', showActiveProducts));
            }

            if (this.filter.clearanceSale) {
                productCriteria.addFilter(Criteria.equals('product.isCloseout', true))
            }

            if (this.filter.selectedManufacturers.length) {
                productCriteria.addFilter(Criteria.equalsAny(
                    'product.manufacturerId',
                    this.filter.selectedManufacturers
                ));
            }

            if (this.filter.productNumber) {
                productCriteria.addFilter(Criteria.contains('product.productNumber', this.filter.productNumber));
            }

            if (this.filter.price.from !== null) {
                productCriteria.addFilter(Criteria.range('product.price', { gte: this.filter.price.from }));
            }

            if (this.filter.price.to !== null) {
                productCriteria.addFilter(Criteria.range('product.price', { lte: this.filter.price.to }));
            }

            if (this.filter.stock.from !== null) {
                productCriteria.addFilter(Criteria.range('product.stock', { gte: this.filter.stock.from }));
            }

            if (this.filter.stock.to !== null) {
                productCriteria.addFilter(Criteria.range('product.stock', { lte: this.filter.stock.to }));
            }

            if (this.filter.missingCover) {
                productCriteria.addFilter(Criteria.equals('product.cover', null));// not working - value null crashes server therefor replaces with empty string here
            }

            if (this.filter.salesChannel) {
                productCriteria.addFilter(Criteria.equals('product.visibilities.salesChannelId', this.filter.salesChannel))
            }

            return productCriteria;
        },

        onInlineEditSave(promise, product) {
            const productName = product.name || this.placeholder(product, 'name');

            return promise.then(() => {
                this.createNotificationSuccess({
                    title: this.$tc('sw-product.list.titleSaveSuccess'),
                    message: this.$tc('sw-product.list.messageSaveSuccess', 0, { name: productName })
                });
            }).catch(() => {
                this.getList();
                this.createNotificationError({
                    title: this.$tc('global.default.error'),
                    message: this.$tc('global.notification.notificationSaveErrorMessage', 0, { entityName: productName })
                });
            });
        },

        onInlineEditCancel(product) {
            product.discardChanges();
        },

        updateTotal({ total }) {
            this.total = total;
        },

        onChangeLanguage(languageId) {
            Shopware.StateDeprecated.getStore('language').setCurrentId(languageId);
            this.getList();
        },

        getCurrencyPriceByCurrencyId(itemId, currencyId) {
            let foundPrice = {
                currencyId: null,
                gross: null,
                linked: true,
                net: null
            };

            // check if products are loaded
            if (!this.products) {
                return foundPrice;
            }

            // find product for itemId
            const foundProduct = this.products.find((item) => {
                return item.id === itemId;
            });

            // find price from product with currency id
            if (foundProduct && foundProduct.price) {
                const priceForProduct = foundProduct.price.find((price) => {
                    return price.currencyId === currencyId;
                });

                if (priceForProduct) {
                    foundPrice = priceForProduct;
                }
            }

            // return the price
            return foundPrice;
        },

        getProductColumns() {
            return [{
                property: 'name',
                label: this.$tc('sw-product.list.columnName'),
                routerLink: 'sw.product.detail',
                inlineEdit: 'string',
                allowResize: true,
                primary: true
            }, {
                property: 'productNumber',
                naturalSorting: true,
                label: this.$tc('sw-product.list.columnProductNumber'),
                align: 'right',
                allowResize: true
            }, {
                property: 'manufacturer.name',
                label: this.$tc('sw-product.list.columnManufacturer'),
                allowResize: true
            }, {
                property: 'active',
                label: this.$tc('sw-product.list.columnActive'),
                inlineEdit: 'boolean',
                allowResize: true,
                align: 'center'
            },
            ...this.currenciesColumns,
            {
                property: 'stock',
                label: this.$tc('sw-product.list.columnInStock'),
                inlineEdit: 'number',
                allowResize: true,
                align: 'right'
            }, {
                property: 'availableStock',
                label: this.$tc('sw-product.list.columnAvailableStock'),
                allowResize: true,
                align: 'right'
            }];
        },

        getManufacturerList() {
            this.manufacturerRepository.search(new Criteria, Shopware.Context.api).then(response => {
                let manufacturers = response;

                manufacturers = manufacturers.map((manufacturer) => {
                    return {
                        id: manufacturer.id,
                        name: manufacturer.name
                    }
                })

                this.manufacturers = manufacturers;
            })
        },

        getSalesChannelList() {
            this.salesChannelRepository.search(new Criteria, Shopware.Context.api).then(response => {
                let salesChannels = response;

                salesChannels = salesChannels.map((salesChannel) => {
                    return {
                        id: salesChannel.id,
                        name: salesChannel.name
                    }
                })

                this.salesChannels = salesChannels;
            })
        },

        onDuplicate(referenceProduct) {
            return this.numberRangeService.reserve('product').then((response) => {
                return this.productRepository.clone(referenceProduct.id, Shopware.Context.api, {
                    productNumber: response.number,
                    name: `${referenceProduct.name} ${this.$tc('sw-product.general.copy')}`,
                    productReviews: null,
                    active: false
                });
            }).then((duplicate) => {
                this.$router.push({ name: 'sw.product.detail', params: { id: duplicate.id } });
            });
        },

        duplicationDisabledTitle(product) {
            if (product.childCount > 0) {
                return this.$tc('sw-product.general.variantDuplication');
            }

            return '';
        }
    }
});
