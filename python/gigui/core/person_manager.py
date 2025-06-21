"""
Person Identity Management for GitInspectorGUI.

This module provides sophisticated person identity management that handles
multiple author names/emails for the same person, with advanced merging
algorithms for accurate git analysis.

Migrated from gitinspectorgui-old/src/gigui/person_data.py
"""

import time
from fnmatch import fnmatchcase
from logging import getLogger

from gigui.legacy.typedefs import Author, Email

SECONDS_IN_DAY = 60 * 60 * 24
DAYS_IN_MONTH = 30.44
DAYS_IN_YEAR = 365.25

logger = getLogger(__name__)

NOW = int(time.time())  # current time as Unix timestamp in seconds since epoch


class Person:
    """
    Represents a person with multiple author names and email addresses.

    This class handles sophisticated identity merging, allowing multiple
    author names and email addresses to be associated with the same person.
    It includes advanced normalization algorithms that prefer names with
    spaces and handle special characters appropriately.

    Key Features:
    - Advanced author name normalization (preferring names with spaces)
    - Email pattern matching and merging
    - Filter pattern support for exclusions
    - Identity merging algorithms
    """

    show_renames: bool
    ex_author_patterns: list[str] = []
    ex_email_patterns: list[str] = []

    def __init__(self, author: Author, email: Email):
        super().__init__()
        self.authors: set[Author] = {author}
        self.emails: set[Email] = {email}
        self.author: Author = self.get_author()

        # If any of the filters match, this will be set to True
        # so that the person will be excluded from the output.
        self.filter_matched: bool = False

        self.match_author_filter(author)
        self.match_email_filter(email)

    def match_author_filter(self, author: str):
        """Check if author matches any exclusion patterns."""
        self.find_filter_match(self.ex_author_patterns, author)

    def match_email_filter(self, email: str):
        """Check if email matches any exclusion patterns."""
        self.find_filter_match(self.ex_email_patterns, email)

    def find_filter_match(self, patterns: list[str], author_or_email: str):
        """
        Check if author or email matches any filter patterns.

        Uses case-insensitive fnmatch pattern matching to determine
        if the given author or email should be excluded.
        """
        if (
            not self.filter_matched
            and not author_or_email == "*"
            and any(fnmatchcase(author_or_email.lower(), pattern.lower()) for pattern in patterns)
        ):
            self.filter_matched = True

    def merge(self, other: "Person") -> "Person":
        """
        Merge another person's identity into this person.

        Combines author names, email addresses, and filter status.
        Handles special case where emails are empty strings.

        Args:
            other: Another Person instance to merge

        Returns:
            Self (for method chaining)
        """
        self.authors |= other.authors
        if self.emails == {""}:
            self.emails = other.emails
        else:
            self.emails |= other.emails
        self.filter_matched = self.filter_matched or other.filter_matched
        self.author = self.get_author()
        return self

    def __repr__(self):
        authors = self.authors_str
        emails = self.emails_str
        s = f"person({self.__str__()})\n"
        s += f"  author = {authors}\n"
        s += f"  email = {emails}\n"
        s += f"  filter_matched = {self.filter_matched}\n"
        return s

    def __str__(self):
        s = f"{self.authors_str}, {self.emails_str}\n"
        return s

    # Required for manipulating Person objects in a set
    def __hash__(self) -> int:
        return hash((frozenset(self.authors), frozenset(self.emails)))

    def get_authors(self) -> list[Author]:
        """
        Get authors sorted by quality preference.

        Implements sophisticated author name normalization:
        1. Top authors: Names with spaces and only alphanumeric/space characters
        2. Nice authors: Names with spaces but may have special characters
        3. Other authors: Single names or names with special characters

        Returns:
            List of authors sorted by preference and length
        """
        # nice authors have first and last name
        nice_authors = {author for author in self.authors if " " in author}

        # top authors also do not have a period or comma in their name.
        top_authors = {
            author for author in nice_authors if all(c.isalnum() or c.isspace() for c in author)
        }

        nice_authors = nice_authors - top_authors
        other_authors = self.authors - top_authors - nice_authors
        return (
            sorted(top_authors, key=len)
            + sorted(nice_authors, key=len)
            + sorted(other_authors, key=len)
        )

    def get_author(self) -> Author:
        """Get the best/preferred author name for this person."""
        return self.get_authors()[0]

    @property
    def authors_str(self) -> str:
        """
        Get formatted string representation of authors.

        Returns either all authors (if show_renames is True) or just
        the preferred author name.
        """
        if self.show_renames:
            authors = self.get_authors()
            return " | ".join(authors)
        return self.author

    @property
    def emails_str(self) -> str:
        """
        Get formatted string representation of emails.

        Implements intelligent email selection:
        - If only one email, return it
        - If show_renames is True, return all emails
        - Otherwise, prefer emails that contain parts of the author name

        Returns:
            Formatted email string
        """
        emails = list(self.emails)
        emails = sorted(emails, key=len)
        if len(emails) == 1:
            return emails[0]
        if self.show_renames:
            return " | ".join(emails)
        email_list = list(self.emails)
        name_parts = self.author.split()
        name_parts = [part.lower() for part in name_parts if len(part) >= 3]
        # If any part with size >= 3 of author name is in the email, use that email
        nice_emails = [email for email in email_list if any(part in email for part in name_parts)]
        if nice_emails:
            return nice_emails[0]
        return email_list[0]  # assume self.emails cannot be empty


class PersonsDB(dict[Author | Email, Person]):
    """
    Database for managing collections of persons with identity merging.

    This class provides sophisticated person identity management that can
    merge multiple author names and email addresses that belong to the same
    person. It handles various edge cases like empty authors/emails and
    provides efficient lookup and filtering capabilities.

    The database stores found email addresses and usernames of users in the
    analyzed repositories and tries to merge the information if they seem to
    point to the same person. A person can have several usernames and/or
    several email addresses.

    Key Features:
    - Automatic identity merging based on shared authors/emails
    - Handling of empty/None authors and emails
    - Filter support for excluding persons
    - Efficient person lookup and management
    """

    def __init__(self) -> None:
        super().__init__()
        self["*"] = Person("*", "*")
        # There can only be one empty "" key. If the "" key is present, it
        # belongs to a person where both author and email are the empty string ""

    def __getitem__(self, key: Author | Email | None) -> Person:
        key = "" if key is None else key
        return super().__getitem__(key)

    def __setitem__(self, key: Author | Email | None, value: Person) -> None:
        key = "" if key is None else key
        super().__setitem__(key, value)

    def add_person(self, author: Author | None, email: Email | None) -> "Person":
        """
        Add a person to the database with sophisticated identity merging.

        This method implements complex logic to handle various cases:
        - Empty authors with non-empty emails (logs warning)
        - Authors with unknown emails
        - Complete author/email pairs with potential merging

        Args:
            author: Author name (can be None or empty)
            email: Email address (can be None or empty)

        Returns:
            Person object (either existing or newly created)
        """
        author = "" if author is None else author
        email = "" if email is None else email

        if author == "":
            if email != "":
                logger.warning(
                    f"Author is empty but email is not. Author: {author}, Email: {email}"
                    "Git should not allow this. Using empty for both."
                )
            if "" in self:
                return self[""]
            person = Person("", "")
            self[""] = person
            return person
        if email == "":
            person = self.add_author_with_unknown_email(author)
            return person
        # Both author and email are known
        p_author = self.get(author)
        p_email = self.get(email)

        if p_author is not None:
            if p_email is not None:
                if p_author == p_email:
                    return p_author  # existing person
                return p_author.merge(p_email)  # merge persons
            # author exists, email is new
            p_author.merge(Person(author, email))
            self[email] = p_author
            return p_author
        if p_email is not None:
            p_email.merge(Person(author, email))
            self[author] = p_email
            return p_email
        # new person
        person = Person(author, email)
        self[author] = person
        self[email] = person
        return person

    def __repr__(self):
        return "\n".join(f"{key}:\n{person!r}" for key, person in self.items())

    def __str__(self):
        return "\n".join(str(person) for person in self.persons)

    @property
    def persons(self) -> list["Person"]:
        """Get all unique persons sorted by author name."""
        persons = self.values()
        persons_set = set(persons)
        return sorted(persons_set, key=lambda x: x.author)

    @property
    def authors(self) -> list[Author]:
        """Get list of all author names."""
        return [person.author for person in self.persons]

    @property
    def filtered_persons(self) -> list["Person"]:
        """Get persons that are not filtered out."""
        persons_set_filtered = {person for person in self.persons if not person.filter_matched}
        return sorted(persons_set_filtered, key=lambda x: x.author)

    @property
    def authors_included(self) -> list[Author]:
        """Get list of authors that are not filtered out."""
        return [person.author for person in self.persons if not person.filter_matched]

    @property
    def authors_excluded(self) -> list[Author]:
        """Get list of authors that are filtered out."""
        return [person.author for person in self.persons if person.filter_matched]

    def add_author_with_unknown_email(self, author: Author) -> "Person":
        """
        Add an author with unknown email address.

        Args:
            author: Author name

        Returns:
            Person object (either existing or newly created)
        """
        if author in self:
            return self[author]
        person = Person(author, "")
        self[author] = person
        return person

    def get_filtered_author(self, author: Author | None) -> Author | None:
        """
        Get author name if not filtered out.

        Args:
            author: Author name to check

        Returns:
            Author name if not filtered, None otherwise
        """
        person = self[author]
        if person.filter_matched:
            return None
        return person.author
