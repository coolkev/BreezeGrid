declare module BreezeGrid {
    class BreezeGrid<T> {
        constructor(options: GridOptions<T>);
        columns: KnockoutObservableArray<ColumnBase>;

        sortColumn: KnockoutObservable<ColumnBase>;
        sortDesc: KnockoutObservable<boolean>;
        totalCount: KnockoutObservable<number>;

        rows: KnockoutObservableArray<T>;
        paging: Paging;

        loading: KnockoutObservable<boolean>;
        templates: { [index: string]: string; };
        search();
    }


    interface DataProvider {
        executeQuery(options: QueryOptions, callback: breeze.ExecuteQuerySuccessCallback): Q.Promise<breeze.QueryResult>;
        createEntity();
        saveChanges(row, saveOptions?: breeze.SaveOptions): Q.Promise<breeze.SaveResult>;

    }

    class BreezeDataProvider implements DataProvider {

        constructor(manager: breeze.EntityManager, query: breeze.EntityQuery, entityTypeName: string);

        executeQuery(options: QueryOptions, callback: breeze.ExecuteQuerySuccessCallback): Q.Promise<breeze.QueryResult>;

        createEntity();
        public saveChanges(row): Q.Promise<breeze.SaveResult>;
        public manager: breeze.EntityManager;
        public query: breeze.EntityQuery;
    }

    interface GridOptions<TEntity> {

        dataProvider: DataProvider;
        plugins?: any[];
        columns: Column<TEntity>[];
        rowCssClass?: (row?: TEntity) => string;
        rowBindings?: string;
        tableCssClass?: string;
    }

    interface QueryOptions {
        sortColumn: string;
        sortDesc: boolean;
        currentPage?: number;
        pageSize?: number;
        includeTotalCount?: boolean;
    }


    interface Paging {
        pageCount: KnockoutComputed<number>;
        currentPage: KnockoutObservable<number>;
        pageSize: KnockoutObservable<number>;
        pageSizes: number[];
    }

    interface ColumnBase {

        sortable?: boolean;
        sortExpression?: string;
        editor?: any;
        width?: number;
        headerText?: string;
        fieldName?: string;

    }
    interface Column<TEntity> extends ColumnBase {

        field?: (entity: TEntity) => any;
        cssClass?: (row?: TEntity) => string;
        formatter?: (value: any, row?: TEntity) => string;
        viewTemplate?: (col: Column<TEntity>, value, row: TEntity) => any;
    }


    module Editors {
        class Editor {
            getTemplate(col: Column<any>, row);
        }


        class Text extends Editor {

        }

        class Checkbox extends Editor {

        }

        class Select extends Editor {

        }

        class MultiSelect extends Editor {

        }
    }


    module Plugins {

        class Editing {

        }

        class Paging {

        }

    }

    class ViewBuilder<TEntity> {


        public Default(col: Column<TEntity>, value, row: TEntity);

        public ExtendDefault(builder: (row: TEntity) => any);


        public Hyperlink(hrefBuilder: (row: TEntity) => string);



    }
}