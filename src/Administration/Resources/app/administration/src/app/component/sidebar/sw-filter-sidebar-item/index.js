import template from './sw-filter-sidebar-item.html.twig';
import './sw-filter-sidebar-item.scss';

const { Component } = Shopware;
const { Criteria } = Shopware.Data;

const filterInputTypeOptions = {
    switch: 'switch',
    range: 'range',
    input: 'input',
    number: 'number',
    singleSelect: 'singleSelect',
    multiSelect: 'multiSelect'
}

Component.register('sw-filter-sidebar-item', {
    template,

    inject: ['repositoryFactory'],

    data() {
        return {
            isLoading: false,
            filter: {},
            selectedOptions: {},
            repository: {}
        };
    },

    props: {
        filterOptions: {
            type: Array,
            required: false,
            default: [
                {
                    name: 'activeInactive',
                    label: 'activeInactive',
                    placeholder: 'activeInactive',
                    field: 'product.active',
                    inputType: 'singleSelect',
                    criteriaType: 'equals',
                    options: [
                        {
                            name: 'Active',
                            value: true
                        },
                        {
                            name: 'Inactive',
                            value: false
                        }
                    ]
                },
            ],
            schema: [{
                name: 'camelCase, unique',
                label: 'label for input',
                placeholder: 'placeholder for input',
                field: 'field for query e.g. product.active',
                inputType: 'one of filterInputTypeOptions',
                criteriaType: 'Criteria operator e.g. equals',
                options: [
                    {
                        name: 'option name',
                        value: 'unique id'
                    },
                    {
                        name: 'option name',
                        value: 'unique id'
                    }
                ],
                repository: 'repository reference used to with repositoryFactory.create - this is used to populate options'
            }]
        }
    },

    watch: {
        filter: {
            handler() {
                this.$emit('update-criteria-array', this.getCriteriaArray())
            },
            deep: true
        }
    },

    async created() {
        this.setRepositoriesAndNestedVariables();

        await this.setOptionsOnFilters();
    },

    methods: {
        inputTrigger(event, filterOptionName) {
            this.filter[filterOptionName] = event;
        },

        setRepositoriesAndNestedVariables() {
            const neededRepositories = [];
            for (const filterOption of this.filterOptions) {
                if (filterOption.repository) {
                    neededRepositories.push(filterOption.repository);
                }

                if (filterOption.inputType === 'range') {
                    this.filter[filterOption.name] = {};
                }
            }

            for (const neededRepository of neededRepositories) {
                this.repository[neededRepository] = this.repositoryFactory.create(neededRepository);
            }
        },

        setOptionsOnFilters() {
            this.loading = true;
            const promises = []
            for (let filterOption of this.filterOptions) {
                if (filterOption.repository) {
                    promises.push(this.repository[filterOption.repository].search(
                        new Criteria,
                        Shopware.Context.api
                    ).then((response) => {

                        response = response.map((object) => {
                            return {
                                name: object.name || object.title,
                                value: object.id
                            }
                        })

                        filterOption.options = response;
                    }));
                }
            }
            return Promise.all(promises).then(() => {
                this.loading = false;
            })
        },

        updateProductNumberFilter(productNumber) {
            this.filter.productNumber = productNumber;
        },

        getCriteriaArray() {
            const criteriaArray = [];

            for (const filterOption of this.filterOptions) {
                if (!filterInputTypeOptions[filterOption.inputType]) {
                    console.error(`Unknown type ${filterOption.inputType} for ${JSON.parse(filterOption)}`);
                    continue;
                }

                const { field } = filterOption;

                let value;
                if (filterOption.criteriaType === 'range') {
                    value = {};
                    if (this.filter[filterOption.name].from) {
                        value.gte = this.filter[filterOption.name].from
                    }
                    if (this.filter[filterOption.name].to) {
                        value.lte = this.filter[filterOption.name].to
                    }
                    if (!value.gte && !value.lte) continue;
                } else {
                    value = this.filter[filterOption.name];
                }

                if ((typeof value === 'undefined') || value === null || value.length === 0) continue;

                try {
                    criteriaArray.push(Criteria[filterOption.criteriaType](field, value));
                } catch (e) {
                    console.error(`Unknown criteriaType ${filterOption.criteriaType} for ${filterOption}`);
                    console.error(e);
                }

            }

            return criteriaArray;
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
        }
    }
});
