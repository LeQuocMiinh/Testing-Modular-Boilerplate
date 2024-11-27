import typia, { tags } from "typia";

export type TodoList = {
    title: string & tags.MinLength<8> & tags.MaxLength<500>;
    description: string & tags.MinLength<8> & tags.MaxLength<500>;
};

export type UpdateItem = {
    id: string & tags.MinLength<24> & tags.MaxLength<24>;
}