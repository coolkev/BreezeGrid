module BreezeGrid.Plugins {

    export interface EditorColumn<T> extends Column<T> {

        editorInstance: Editors.Editor;
    }

    export class Editing<T> implements BreezeGridPlugin<T> {

        private grid: BreezeGrid<T>;

        private original: BreezeGridMethods<T>;
        public init(grid: BreezeGrid<T>, original: BreezeGridMethods<T>): void {

            this.grid = grid;
            this.original = original;
        }

        public getCurrentView(column: EditorColumn<T>, row: T) {

            if ((<any>row).editing() && column.editor) {
                return column.editorInstance.getTemplate(column, row);
            }
            return this.original.getCurrentView(column, row);
        }

        public initColumn(col: EditorColumn<T>): void {

            this.original.initColumn(col);

            if (col.editor) {
                if (typeof (col.editor) == 'function') {
                    col.editorInstance = new col.editor();
                } else {
                    col.editorInstance = col.editor;
                }
            }

        }

        public addNew() {

            var entity = <any>this.grid.dataProvider.createEntity();
            entity.editing = ko.observable(true);
            this.grid.rows.unshift(entity);
        }

        public editRow(row: T) {
            (<any>row).editing(true);
            return true;
        }

        public cancelEditRow(row: breeze.Entity) {

            var entity = (<breeze.Entity><any>row);
            if (entity.entityAspect.entityState == breeze.EntityState.Added) {
                this.grid.rows.remove(<any>row);
            } else {
                entity.entityAspect.rejectChanges();
                (<any>row).editing(false);

            }
        }

        public saveRow(row: breeze.Entity) {

            this.grid.dataProvider.saveChanges([row]).then(saveResult => {
                (<any>row).editing(false);
            }).fail(r => {
                    alert(r.entityErrors.map((m: breeze.ValidationError) => m.errorMessage).join(','));
                });

        }

        public deleteRow(row: breeze.Entity) {

            $('#dialog-delete .btn-primary').one('click', e => {

                row.entityAspect.setDeleted();

                this.grid.dataProvider.saveChanges([row]).then(saveResult => {
                    $('#dialog-delete').modal('hide');
                    this.grid.rows.remove(<any>row);
                }).fail(r => {
                        $('#dialog-delete').modal('hide');
                        alert(r);
                    });

            });

            $('#dialog-delete').on('hide.bs.modal', function (e) {
                $('#dialog-delete .btn-primary').unbind('click');

            }).modal();


        }

        public getDefaultTemplates() {

            var templates = this.original.getDefaultTemplates();

            templates.headerRowTemplate = '<th class="icons"></th><!-- ko template: {name: headerCellTemplateName, foreach: columns } --><!-- /ko -->';

            templates['viewIconsTemplate'] =
            '<button type="button" class="btn btn-primary btn-xs edit" title="Edit" data-bind="click: $parent.editRow.bind($parent)"><span class="glyphicon glyphicon-pencil"></span></button>' +
            '<button type="button" class="btn btn-danger btn-xs delete" title="Delete" data-bind="click: $parent.deleteRow.bind($parent)"><span class="glyphicon glyphicon-remove"></span></button>';

            templates['editIconsTemplate'] = '<button type="button" class="btn btn-success btn-xs" title="Save Changes" data-bind="click: $parent.saveRow.bind($parent)"><span class="glyphicon glyphicon-ok"></span></button>' +
            '<button type="button" class="btn btn-warning btn-xs" title="Cancel Edit" data-bind="click: $parent.cancelEditRow.bind($parent)"><span class="glyphicon glyphicon-thumbs-down"></span></button>';

            templates['footerRowTemplate'] = '<td class="icons"></td>' + templates['footerRowTemplate'];
            return templates;

        }

        public getRowTemplate() {

            var rowbindings = '';

            if (this.grid.options.rowCssClass) {
                rowbindings = "attr: {'class': $parent.options.rowCssClass($data) }, ";
            }

            if (this.grid.options.rowBindings) {
                rowbindings += this.grid.options.rowBindings;
            }

            var rowTemplate = '<tr data-bind="' + rowbindings + '"><td class="icons" data-bind="template: editing() ? \'editIconsTemplate\' : \'viewIconsTemplate\'"></td>' +
                '<!-- ko foreach: $parent.columns  -->' +
                '<td class="cell" data-bind="breezeCell: $data, style: {width: width}"></td>' +
                '<!-- /ko --></tr>';

            return rowTemplate;
        }

        public searchComplete(data: breeze.QueryResult) {

            data.results.forEach((r: any) => r.editing = r.editing || ko.observable(false));

            this.original.searchComplete(data);
        }

        public initBindings(element: JQuery) {

            element.addClass("editable");

        }

    }

}
