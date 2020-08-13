import { shallowMount } from '@vue/test-utils';
import 'src/module/sw-settings-custom-field/component/sw-custom-field-list';
import 'src/app/component/grid/sw-grid';
import 'src/app/component/grid/sw-pagination';

const set = {
    id: '9f359a2ab0824784a608fc2a443c5904',
    customFields: {}
};

let customFields = mockCustomFieldData();

function mockCustomFieldData() {
    const _customFields = [];

    for (let i = 0; i < 10; i += 1) {
        const customField = {
            id: `id${i}`,
            name: `custom_additional_field_${i}`,
            config: {
                label: { 'en-GB': `Special field ${i}` },
                customFieldType: 'checkbox',
                customFieldPosition: i + 1
            }
        };

        _customFields.push(customField);
    }

    return _customFields;
}

function mockCustomFieldRepository() {
    class Repository {
        constructor() {
            this._customFields = customFields;
        }

        search() {
            const response = this._customFields;
            response.total = this._customFields.length;

            response.sort((a, b) => a.config.customFieldPosition - b.config.customFieldPosition);

            return Promise.resolve(this._customFields);
        }

        save(field) {
            if (field.id === 'id1337') {
                this._customFields.push(field);
            }

            return Promise.resolve();
        }

        syncDeleted() {
            this._customFields.splice(0, 1);

            return Promise.resolve();
        }
    }

    return new Repository();
}

function createWrapper() {
    customFields = mockCustomFieldData();

    return shallowMount(Shopware.Component.build('sw-custom-field-list'), {
        mocks: {
            $tc: () => {},
            $device: {
                getSystemKey: () => {},
                onResize: () => {}
            }
        },
        propsData: {
            set: set
        },
        provide: {
            repositoryFactory: {
                create() {
                    return mockCustomFieldRepository();
                }
            }
        },
        stubs: {
            'sw-button': true,
            'sw-card': true,
            'sw-empty-state': '<div></div>',
            'sw-simple-search-field': '<div></div>',
            'sw-container': true,
            'sw-grid': Shopware.Component.build('sw-grid'),
            'sw-context-button': '<div></div>',
            'sw-grid-column': '<div class="sw-grid-column"><slot></slot></div>',
            'sw-grid-row': '<div class="sw-grid-row"><slot></slot></div>',
            'sw-field': '<div></div>',
            'sw-pagination': Shopware.Component.build('sw-pagination'),
            'sw-icon': true,
            'sw-loader': true,
            'sw-modal': true
        }
    });
}

describe('src/module/sw-settings-custom-field/page/sw-settings-custom-field-set-detail', () => {
    it('should be a Vue.js component', () => {
        const wrapper = createWrapper();
        expect(wrapper.isVueInstance()).toBe(true);
    });

    it('should always have a pagination', async () => {
        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        const pagination = wrapper.find('.sw-pagination');
        expect(pagination.exists()).toBe(true);
    });

    it('should have one page initially', async () => {
        const wrapper = createWrapper();
        await wrapper.vm.$nextTick();

        const paginationButtons = wrapper.findAll('.sw-pagination__list-button');
        expect(paginationButtons.length).toBe(1);
    });

    it('should create new custom field', async () => {
        const wrapper = createWrapper();

        const newCustomField = {
            id: 'id1337',
            name: 'new_field',
            config: {
                label: { 'en-GB': 'New' },
                customFieldType: 'text',
                customFieldPosition: 0
            }
        };

        await wrapper.vm.onSaveCustomField(newCustomField);
        await wrapper.vm.$nextTick();

        // Should have two pagination buttons after add
        const paginationButtons = wrapper.findAll('.sw-pagination__list-button');
        expect(paginationButtons.length).toBe(2);

        // Should be in grid on correct position
        const expectedRow = wrapper.findAll('.sw-grid .sw-grid__body .sw-grid-row').at(0);
        expect(expectedRow.find('.sw-grid-column[dataIndex="label"]').text()).toBe('New');
    });

    it('should delete custom field', async () => {
        const wrapper = createWrapper();

        const deleteCustomField = {
            id: 'id0',
            name: 'custom_additional_field_1',
            config: {
                label: { 'en-GB': 'Special field 1' },
                customFieldType: 'checkbox',
                customFieldPosition: 0
            }
        };

        wrapper.setData({
            deleteCustomField: deleteCustomField
        });

        await wrapper.vm.onDeleteCustomField();
        await wrapper.vm.$nextTick();

        const rows = wrapper.findAll('.sw-grid .sw-grid__body .sw-grid-row');
        expect(rows.length).toBe(9);

        const expectedRow = rows.at(0);
        expect(expectedRow.find('.sw-grid-column[dataIndex="label"]').text()).toBe('Special field 1');
    });

    it('should sort custom fields by position ', async () => {
        const wrapper = createWrapper();

        await wrapper.vm.$nextTick();

        const customFieldPositionCells = wrapper.findAll('.sw-grid-column[dataIndex="position"]').wrappers;
        const [first, second, third, fourth] = customFieldPositionCells;

        expect(first.text()).toBe('1');
        expect(second.text()).toBe('2');
        expect(third.text()).toBe('3');
        expect(fourth.text()).toBe('4');
    });
});
