/**
 * Pimcore
 *
 * This source file is subject to the GNU General Public License version 3 (GPLv3)
 * For the full copyright and license information, please view the LICENSE.md and gpl-3.0.txt
 * files that are distributed with this source code.
 *
 * @copyright  Copyright (c) 2009-2015 pimcore GmbH (http://www.pimcore.org)
 * @license    http://www.pimcore.org/license     GNU General Public License version 3 (GPLv3)
 */

pimcore.registerNS("pimcore.object.classificationstore.propertiespanel");
pimcore.object.classificationstore.propertiespanel = Class.create({

    initialize: function () {
    },

    getPanel: function () {
        if (this.layout == null) {
            this.layout = new Ext.Panel({
                title: t("classificationstore_properties"),
                iconCls: "pimcore_icon_key",
                border: false,
                layout: "fit",
                region: "center"
            });

            this.createGrid();
        }

        this.layout.on("activate", this.panelActivated.bind(this));

        return this.layout;
    },

    panelActivated: function() {
        if (this.store) {
            this.store.reload();
        }
    },

    createGrid: function(response) {
        this.fields = ['id', 'name', 'description', 'type',
            'creationDate', 'modificationDate', 'definition', 'title', 'sorter'];

        var readerFields = [];
        for (var i = 0; i < this.fields.length; i++) {
            readerFields.push({name: this.fields[i], allowBlank: true});
        }

        var url = "/admin/classificationstore/properties?";
        var proxy = {
            type: 'ajax',
            reader: {
                type: 'json',
                rootProperty: 'data'
            },
            api: {
                create  : url + "xaction=create",
                read    : url + "xaction=read",
                update  : url + "xaction=update",
                destroy : url + "xaction=destroy"
            },
            writer: {
                type: 'json',
                writeAllFields: true,
                rootProperty: 'data',
                encode: 'true'
            }
        };

        var listeners = {};

        listeners.exception = function (conn, mode, action, request, response, store) {
            if(action == "update") {
                Ext.MessageBox.alert(t('error'), t('cannot_save_object_please_try_to_edit_the_object_in_detail_view'));
                this.store.rejectChanges();
            }
        }.bind(this);


        this.store = new Ext.data.Store({
            autoSync: true,
            proxy: proxy,
            fields: readerFields,
            listeners: listeners,
            remoteFilter: true
        });

        var gridColumns = [];

        gridColumns.push({header: "ID", width: 40, sortable: true, dataIndex: 'id'});
        gridColumns.push({
                header: t("name"),
                width: 200,
                sortable: true,
                dataIndex: 'name',
                filter: 'string',
                editor: new Ext.form.TextField({})
            }

        );gridColumns.push({header: t("title"), width: 200, sortable: false, dataIndex: 'title',editor: new Ext.form.TextField({}), filter: 'string'});
        gridColumns.push({header: t("description"), width: 300, sortable: true, dataIndex: 'description',editor: new Ext.form.TextField({}), filter: 'string'});
        gridColumns.push({header: t("definition"), width: 300, sortable: true, hidden: true, dataIndex: 'definition',editor: new Ext.form.TextField({})});
        gridColumns.push({header: t("type"), width: 150, sortable: true, dataIndex: 'type', filter: 'string',
            editor: new Ext.form.ComboBox({
                triggerAction: 'all',
                editable: false,
                store: ['input','textarea','wysiwyg','checkbox','numeric','slider', 'select','multiselect',
                    'date','datetime','language','languagemultiselect','country','countrymultiselect','table',"quantityValue"]
            })});


        gridColumns.push({
            hideable: false,
            xtype: 'actioncolumn',
            width: 30,
            items: [
                {
                    tooltip: t("classificationstore_detailed_configuration"),
                    icon: "/pimcore/static6/img/icon/building_edit.png",
                    handler: this.showDetailedConfig.bind(this)
                }
            ]
        });

        var dateRenderer =  function(d) {
            if (d !== undefined) {
                var date = new Date(d * 1000);
                return Ext.Date.format(date, "Y-m-d H:i:s");
            } else {
                return "";
            }
        };


        gridColumns.push(
            {header: t("creationDate"), sortable: true, dataIndex: 'creationDate', editable: false, width: 130,
                hidden: true,
                renderer: dateRenderer
            }
        );

        gridColumns.push(
            {header: t("modificationDate"), sortable: true, dataIndex: 'modificationDate', editable: false, width: 130,
                hidden: true,
                renderer: dateRenderer            }
        );

        gridColumns.push({
            hideable: false,
            xtype: 'actioncolumn',
            width: 30,
            items: [
                {
                    tooltip: t('remove'),
                    icon: "/pimcore/static6/img/icon/cross.png",
                    handler: function (grid, rowIndex) {
                        var data = grid.getStore().getAt(rowIndex);
                        var id = data.data.id;

                        Ext.Ajax.request({
                            url: "/admin/classificationstore/delete-property",
                            params: {
                                id: id
                            },
                            success: function (response) {
                                this.store.reload();
                            }.bind(this)});
                    }.bind(this)
                }
            ]
        });


        this.pagingtoolbar = new Ext.PagingToolbar({
            pageSize: 15,
            store: this.store,
            displayInfo: true,
            displayMsg: '{0} - {1} / {2}',
            emptyMsg: t("classificationstore_no_keys")
        });

        var cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
            listeners: {
                edit: function (editor, e) {
                    var field = e.field;
                    var rec = e.record;
                    var val = e.value;
                    var originalValue = e.originalValue;

                    var definition = rec.get("definition");
                    definition = Ext.util.JSON.decode(definition);
                    if (field == "name") {
                        definition.name = val;
                        definition = Ext.util.JSON.encode(definition);
                        rec.set("definition", definition);
                    } else if (field == "type") {
                        definition.fieldtype = val;
                        definition = Ext.util.JSON.encode(definition);
                        rec.set("definition", definition);
                    } else if (field == "title") {
                        definition.title = val;
                        definition = Ext.util.JSON.encode(definition);
                        rec.set("definition", definition);
                    }

                    if (val != originalValue) {
                        this.showDetailedConfig(e.grid, e.rowIdx);
                    }
                }.bind(this)
            }
        });

        var plugins = ['gridfilters', cellEditing];

        var gridConfig = {
            frame: false,
            store: this.store,
            border: true,
            columns: gridColumns,
            loadMask: true,
            columnLines: true,
            plugins: plugins,
            bodyCls: "pimcore_editable_grid",
            stripeRows: true,
            trackMouseOver: true,
            viewConfig: {
                forceFit: false
            },
            selModel: Ext.create('Ext.selection.RowModel', {}),
            bbar: this.pagingtoolbar,
            tbar: [

                {
                    text: t('add'),
                    handler: this.onAdd.bind(this),
                    iconCls: "pimcore_icon_add"
                }
            ]
        } ;

        this.grid = Ext.create('Ext.grid.Panel', gridConfig);

        this.store.load();

        this.layout.removeAll();
        this.layout.add(this.grid);
        this.layout.updateLayout();
    },

    showDetailedConfig: function (grid, rowIndex) {
        var data = grid.getStore().getAt(rowIndex);
        var id = data.data.id;

        var type = data.data.type;
        var definition = data.data.definition;
        if (definition) {
            definition = Ext.util.JSON.decode(definition);
            definition.name = data.data.name;
        } else {
            definition = {
                name: data.data.name
            };
        }

        definition.fieldtype = type;

        var keyDefinitionWindow = new pimcore.object.classificationstore.keyDefinitionWindow(
            definition, data.id, this);
        keyDefinitionWindow.show();
    },

    applyTranslatorConfig: function(keyid, value) {
        var data = this.store.getById(keyid);
        data.set("translator", value);
    },

    applyDetailedConfig: function(keyid, definition) {

        var name = definition.name;
        definition = Ext.util.JSON.encode(definition);

        var record = this.store.getById(keyid);
        record.set("name",  name);
        record.set("definition",  definition);
    },

    onAdd: function () {
        Ext.MessageBox.prompt(t('classificationstore_mbx_enterkey_title'), t('classificationstore_mbx_enterkey_prompt'),
            this.addFieldComplete.bind(this), null, null, "");
    },

    addFieldComplete: function (button, value, object) {

        value = value.trim();
        if (button == "ok" && value.length > 1) {
            Ext.Ajax.request({
                url: "/admin/classificationstore/add-property",
                params: {
                    name: value
                },
                success: function (response) {
                    var data = Ext.decode(response.responseText);

                    if(!data || !data.success) {
                        Ext.Msg.alert(t("classificationstore_error_addkey_title"), t("classificationstore_error_addkey_msg"));
                    } else {

                        this.store.reload({
                                callback: function() {
                                    var rowIndex = this.store.find('name', value);
                                    if (rowIndex != -1) {
                                        var sm = this.grid.getSelectionModel();
                                        sm.select(rowIndex);
                                    }

                                    var lastOptions = this.store.lastOptions;
                                    Ext.apply(lastOptions.params, {
                                        overrideSort: "false"
                                    });

                                }.bind(this),
                                params: {
                                    "overrideSort": "true"
                                }
                            }

                        );
                    }
                }.bind(this)
            });
        }
        else if (button == "cancel") {
            return;
        }
        else {
            Ext.Msg.alert(t("classificationstore_configuration"), t("classificationstore_invalidname"));
        }
    },


    getData: function () {
        var selected = this.groupGridPanel.getSelectionModel().getSelected();
        if(selected) {
            return selected.data;
        }
        return null;
    }
});