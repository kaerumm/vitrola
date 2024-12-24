### Why?

To learn how programming languages work, and to get an opportunity to work with new concepts

### Objectives

-   To borrow as much as possible from bash to maintain compatibility with its syntax such that
    seasoned developers do not have to relearn anything

-   Keep it simple, all we want is to AT LEAST parse and validate arguments to commands and AT MOST to pipe
    a command's output into another command's input

### Language specification

References used: https://www.gnu.org/software/bash/manual/bash.html

Definitions

- Reference for whitespaces and line breaks: https://en.wikipedia.org/wiki/Whitespace_character

- Whitespace, whitespace tagged characters that are not tagged as line breakers
- 0x0009 - Character Tabulation (Horizontal tab)
- 0x0020 - ASCII Space
- 0x00A0 - Non-breaking Space
- 0x1680 - Ogham Space Mark
- from 0x2000 to 0x200A - Varying Width Space Markers
- 0x205F - Mathematical Space
- 0x3000 - Ideographic Space

- Line breaks, whitespace tagged character that are also tagged as line breakers
- 0x000A - Line Feed (Newline)
- 0x000B - Line Tabulation (Vertical tab)
- 0x000C - Form Feed
- 0x000D - Carriage Return
- 0x0085 - Next line (NEL)
- 0x2028 - Line separator
- 0x2029 - Paragraph Separator

Operators

The OR operator '||' - Takes a left and right operand, if the left operand exits successfully then the right command is
not run and the left operand's exit result is returned, otherwise the right command is ran and its result is returned instead

The AND operator '&&' - Takes a left and right operand, if the left operand does not exit successfully then the right 
command is ran and its exit result is returned instead, otherwise the left operand's return is used.

Reserved Key words
