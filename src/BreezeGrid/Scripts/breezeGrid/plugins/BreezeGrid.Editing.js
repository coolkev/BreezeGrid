var BreezeGrid;
(function (BreezeGrid) {
    (function (Plugins) {
        var Editing = (function () {
            function Editing() {
            }
            Editing.prototype.init = function (grid, original) {
                this.grid = grid;
                this.original = original;
            };

            Editing.prototype.getCurrentView = function (column, row) {
                if (row.editing() && column.editor) {
                    return column.editorInstance.getTemplate(column, row);
                }
                return this.original.getCurrentView(column, row);
            };

            Editing.prototype.initColumn = function (col) {
                this.original.initColumn(col);

                if (col.editor) {
                    if (typeof (col.editor) == 'function') {
                        col.editorInstance = new col.editor();
                    } else {
                        col.editorInstance = col.editor;
                    }
                }
            };

            Editing.prototype.addNew = function () {
                var entity = this.grid.dataProvider.createEntity();
                entity.editing = ko.observable(true);
                this.grid.rows.unshift(entity);
            };

            Editing.prototype.editRow = function (row) {
                row.editing(true);
                return true;
            };

            Editing.prototype.cancelEditRow = function (row) {
                var entity = row;
                if (entity.entityAspect.entityState == breeze.EntityState.Added) {
                    this.grid.rows.remove(row);
                } else {
                    entity.entityAspect.rejectChanges();
                    row.editing(false);
                }
            };

            Editing.prototype.saveRow = function (row) {
                this.grid.dataProvider.saveChanges([row]).then(function (saveResult) {
                    row.editing(false);
                }).fail(function (r) {
                    alert(r.entityErrors.map(function (m) {
                        return m.errorMessage;
                    }).join(','));
                });
            };

            Editing.prototype.deleteRow = function (row) {
                var _this = this;
                if ($('#dialog-delete').length == 0) {
                    $('body').append(this.getDeleteDialogTemplate());
                }

                $('#dialog-delete .btn-primary').one('click', function (e) {
                    row.entityAspect.setDeleted();

                    _this.grid.dataProvider.saveChanges([row]).then(function (saveResult) {
                        $('#dialog-delete').modal('hide');
                        _this.grid.rows.remove(row);
                    }).fail(function (r) {
                        $('#dialog-delete').modal('hide');
                        alert(r);
                    });
                });

                $('#dialog-delete').on('hide.bs.modal', function (e) {
                    $('#dialog-delete .btn-primary').unbind('click');
                }).modal();
            };

            Editing.prototype.getDeleteDialogTemplate = function () {
                return '<div class="modal fade" id="dialog-delete"><div class="modal-dialog"><div class="modal-content">' + '<div class="modal-header">' + '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span></button>' + '<h4 class="modal-title">Confirm Delete</h4>' + '</div>' + '<div class="modal-body">' + '<p>Are you sure you want to delete this record?</p>' + '</div>' + '<div class="modal-footer">' + '<button type="button" class="btn btn-primary">Yes</button>' + '<button type="button" class="btn btn-default" data-dismiss="modal">No</button>' + '</div>' + '</div><!-- /.modal-content --></div><!-- /.modal-dialog --></div><!-- /.modal -->';
            };

            Editing.prototype.getDefaultTemplates = function () {
                var templates = this.original.getDefaultTemplates();

                templates.headerRowTemplate = '<th class="icons"></th><!-- ko template: {name: headerCellTemplateName, foreach: columns } --><!-- /ko -->';

                templates['viewIconsTemplate'] = '<button type="button" class="btn btn-primary btn-xs edit" title="Edit" data-bind="click: $parent.editRow.bind($parent)"><span class="glyphicon glyphicon-pencil"></span></button>' + '<button type="button" class="btn btn-danger btn-xs delete" title="Delete" data-bind="click: $parent.deleteRow.bind($parent)"><span class="glyphicon glyphicon-remove"></span></button>';

                templates['editIconsTemplate'] = '<button type="button" class="btn btn-success btn-xs" title="Save Changes" data-bind="click: $parent.saveRow.bind($parent)"><span class="glyphicon glyphicon-ok"></span></button>' + '<button type="button" class="btn btn-warning btn-xs" title="Cancel Edit" data-bind="click: $parent.cancelEditRow.bind($parent)"><span class="glyphicon glyphicon-thumbs-down"></span></button>';

                templates['footerRowTemplate'] = '<td class="icons"></td>' + templates['footerRowTemplate'];
                return templates;
            };

            Editing.prototype.getRowTemplate = function () {
                var rowbindings = '';

                if (this.grid.options.rowCssClass) {
                    rowbindings = "attr: {'class': $parent.options.rowCssClass($data) }, ";
                }

                if (this.grid.options.rowBindings) {
                    rowbindings += this.grid.options.rowBindings;
                }

                var rowTemplate = '<tr data-bind="' + rowbindings + '"><td class="icons" data-bind="template: editing() ? \'editIconsTemplate\' : \'viewIconsTemplate\'"></td>' + '<!-- ko foreach: $parent.columns  -->' + '<td class="cell" data-bind="breezeCell: $data, style: {width: width}"></td>' + '<!-- /ko --></tr>';

                return rowTemplate;
            };

            Editing.prototype.searchComplete = function (data) {
                data.results.forEach(function (r) {
                    return r.editing = r.editing || ko.observable(false);
                });

                this.original.searchComplete(data);
            };

            Editing.prototype.initBindings = function (element) {
                element.addClass("editable");
            };
            return Editing;
        })();
        Plugins.Editing = Editing;
    })(BreezeGrid.Plugins || (BreezeGrid.Plugins = {}));
    var Plugins = BreezeGrid.Plugins;
})(BreezeGrid || (BreezeGrid = {}));
