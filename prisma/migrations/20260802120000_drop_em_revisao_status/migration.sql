-- The "Em revisão" board column was removed; fold any project still in that
-- state back into "Em edição" so it stays visible on the board.
UPDATE "Project" SET "status" = 'em_edicao' WHERE "status" = 'em_revisao';
