-- Add missing trigger to enforce prevent_home_workspace_deletion function BEFORE DELETE on workspaces
CREATE TRIGGER prevent_deletion_of_home_workspace
BEFORE DELETE ON workspaces
FOR EACH ROW
EXECUTE FUNCTION prevent_home_workspace_deletion();
