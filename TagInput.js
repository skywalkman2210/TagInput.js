// Define JQuery Extension, always passing element as target.
if (typeof jQuery == 'function') {
    $.fn.extend({
        TagInput: function (options) {
            var input = this;
            return TagInput({
                ...{ input: input[0] },
                ...options
            });
        }
    });
}

function TagInput(options) {
    var tags = [];
    var suggestionOptions = [];

    var suggestionContainer;
    let debounceTimer;
    
    var input = options.input;
    var tagContainer = options.tagContainer;

    if (input instanceof jQuery) {
        input = input[0];
    }

    if (tagContainer instanceof jQuery) {
        tagContainer = tagContainer[0];
    }

    if (!input) {
        throw "TagInput: Please supply an input type of 'text' as a target!";
        return;
    }
    
    if (!tagContainer && !tagContainer.innerHTML) {
        throw "TagInput: Please supply an element as a container for the tags!";
        return;
    }

    var setKeyUpSet = options.setKeyUp !== undefined && options.setKeyUp !== null;
    
    if (!setKeyUpSet || options.setKeyUp) {
        input.addEventListener('keyup', e => {
            debounce(refreshSuggestionOptions, 500);

            if (!options.forceSelection && e.key.toLowerCase() == "enter") {
                var value = e.currentTarget.value;
                
                if (value != "") {
                    addTag(value);
                    input.value = "";

                    hideSuggestions();
                }
            } else if (input.value == "") {
                hideSuggestions();
            } else {
                showSuggestions();
            }
        });
    }

    document.addEventListener('click', e => {
        if (suggestionContainer && !suggestionContainer.contains(e.target) && e.target != input) {
            hideSuggestions();
        }
    });

    if (options.tagClass && typeof(options.tagClass) == 'string') {
        if (options.tagClass.includes(" ")) {
            throw "TagInput: TagClass cannot contain a space. Please use an array instead.";
            return;
        }
    }

    const removeAllChildNodes = (parent) => {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
    }

    const renderTags = () => {
        removeAllChildNodes(tagContainer);

        var tagNodes = tags.map(val => {
            var node = document.createElement('div');
            node.classList.add('tag');

            if (options.tagClass && typeof(options.tagClass) == 'string') {
                if (options.tagClass.includes(" ")) {
                    throw "TagInput: TagClass cannot contain a space. Please use an array instead.";
                    return;
                }

                node.classList.add(options.tagClass);
            }

            if (options.tagClass && options.tagClass instanceof Array) {
                options.tagClass.forEach(cls => {
                    node.classList.add(cls);
                });
            }

            node.attributes["data-value"] = val;
            node.innerText = val;

            var closeNode = document.createElement('div');
            closeNode.classList.add('tag-close');

            closeNode.innerText = "x";
            closeNode.addEventListener('click', onRemoveTag);

            node.append(closeNode);

            return node;
        });

        tagNodes.forEach(tag => {
            tagContainer.append(tag);
        });
    }

    const updateSuggestions = opts => {
        suggestionOptions = opts;

        if (suggestionContainer) {
            showSuggestions();
        }
    }

    const addTag = tag => {
        if (tags.includes(tag)) {
            throw "TagInput: Tag already exists";
            return;
        } else {
            tags.push(tag);
            renderTags();
        }
    }

    const removeTag = tag => {
        tags.splice(tags.indexOf(tag), 1);
        renderTags();
    }

    const onRemoveTag = e => {
        var tag = e.currentTarget.parentElement;
        var value = tag.attributes['data-value'];

        removeTag(value);
    }

    const onSuggestionClicked = e => {
        var option = e.currentTarget;
        var value = option.attributes['data-value'];

        input.value = "";

        addTag(value);
        hideSuggestions();
    };

    const hideSuggestions = () => {
        if (suggestionContainer) {
            suggestionContainer.remove();
            suggestionContainer = undefined;
        }
    }

    const getComputedWidth = (el, prop) => {
        return Number(window.getComputedStyle(el, null)
                            .getPropertyValue(prop)
                            .replace('px', ''));
    }

    const showSuggestions = () => {
        if (suggestionContainer) {
            suggestionContainer.remove();
            suggestionContainer = undefined;
        }
        
        var container = document.createElement('div');
        container.classList.add("suggestion-container");

        container.style.position = "absolute";
        container.style.top = `${input.offsetTop + input.offsetHeight}px`;
        container.style.left = `${input.offsetLeft}px`;

        var width = getComputedWidth(input, 'width');
        var padLeft = getComputedWidth(input, 'padding-left');
        var padRight = getComputedWidth(input, 'padding-right');
        var borLeft = getComputedWidth(input, 'border-left-width');
        var borRight = getComputedWidth(input, 'border-right-width');
        
        var containerWidth = width + padLeft + padRight + borLeft + borRight;
        container.style.width = `${containerWidth}px`;

        suggestionOptions.forEach(opt => {
            var lowerValue = input.value.toLowerCase();

            if (opt.toLowerCase().startsWith(lowerValue) && !tags.includes(opt)) {
                var option = document.createElement('div');
                option.classList.add('suggestion-option');
                option.attributes["data-value"] = opt;

                option.value = opt;
                option.innerText = opt;
                option.addEventListener('click', onSuggestionClicked);

                container.append(option);
            }
        });

        suggestionContainer = container;
        input.parentNode.insertBefore(suggestionContainer, input.nextSibling);
    }

    const refreshSuggestionOptions = async () => {
        if (options.onRefreshOptions) {
            var opts = await options.onRefreshOptions();
            updateSuggestions(opts);
        }
    }

    const debounce = (callback, time) => {
        window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(callback, time);
    }

    refreshSuggestionOptions();

    return { updateSuggestions, addTag, removeTag};
}