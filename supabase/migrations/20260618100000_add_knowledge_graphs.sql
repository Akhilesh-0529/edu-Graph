--------------- GRAPHS ---------------

-- TABLE --

CREATE TABLE IF NOT EXISTS graphs (
    -- ID
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- REQUIRED RELATIONSHIPS
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- OPTIONAL RELATIONSHIPS
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,

    -- METADATA
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,

    -- REQUIRED
    description TEXT NOT NULL CHECK (char_length(description) <= 1000),
    name TEXT NOT NULL CHECK (char_length(name) <= 100)
);

-- INDEXES --

CREATE INDEX graphs_user_id_idx ON graphs(user_id);

-- RLS --

ALTER TABLE graphs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own graphs"
    ON graphs
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- TRIGGERS --

CREATE TRIGGER update_graphs_updated_at
BEFORE UPDATE ON graphs
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

--------------- GRAPH WORKSPACES ---------------

-- TABLE --

CREATE TABLE IF NOT EXISTS graph_workspaces (
    -- REQUIRED RELATIONSHIPS
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    graph_id UUID NOT NULL REFERENCES graphs(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    PRIMARY KEY(graph_id, workspace_id),

    -- METADATA
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

-- INDEXES --

CREATE INDEX graph_workspaces_user_id_idx ON graph_workspaces(user_id);
CREATE INDEX graph_workspaces_graph_id_idx ON graph_workspaces(graph_id);
CREATE INDEX graph_workspaces_workspace_id_idx ON graph_workspaces(workspace_id);

-- RLS --

ALTER TABLE graph_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own graph_workspaces"
    ON graph_workspaces
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- TRIGGERS --

CREATE TRIGGER update_graph_workspaces_updated_at
BEFORE UPDATE ON graph_workspaces 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

--------------- GRAPH NODES ---------------

-- TABLE --

CREATE TABLE IF NOT EXISTS graph_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    graph_id UUID NOT NULL REFERENCES graphs(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) <= 100),
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#3b82f6',
    size INTEGER NOT NULL DEFAULT 15,
    x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    y DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

-- RLS --

ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own graph_nodes"
    ON graph_nodes
    USING (
        graph_id IN (SELECT id FROM graphs WHERE user_id = auth.uid())
    )
    WITH CHECK (
        graph_id IN (SELECT id FROM graphs WHERE user_id = auth.uid())
    );

--------------- GRAPH LINKS ---------------

-- TABLE --

CREATE TABLE IF NOT EXISTS graph_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    graph_id UUID NOT NULL REFERENCES graphs(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

-- RLS --

ALTER TABLE graph_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own graph_links"
    ON graph_links
    USING (
        graph_id IN (SELECT id FROM graphs WHERE user_id = auth.uid())
    )
    WITH CHECK (
        graph_id IN (SELECT id FROM graphs WHERE user_id = auth.uid())
    );

--------------- GRAPH NODE FILES ---------------

-- TABLE --

CREATE TABLE IF NOT EXISTS graph_node_files (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,

    PRIMARY KEY(node_id, file_id),

    -- METADATA
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);

-- INDEXES --

CREATE INDEX idx_graph_node_files_node_id ON graph_node_files (node_id);
CREATE INDEX idx_graph_node_files_file_id ON graph_node_files (file_id);

-- RLS --

ALTER TABLE graph_node_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to own graph_node_files"
    ON graph_node_files
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
