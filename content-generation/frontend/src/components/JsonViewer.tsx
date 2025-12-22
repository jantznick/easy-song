import { useState } from 'react';

interface JsonViewerProps {
  data: any;
  level?: number;
  path?: string;
}

function JsonViewer({ data, level = 0, path = '' }: JsonViewerProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (key: string) => {
    const newCollapsed = new Set(collapsed);
    if (newCollapsed.has(key)) {
      newCollapsed.delete(key);
    } else {
      newCollapsed.add(key);
    }
    setCollapsed(newCollapsed);
  };

  const isCollapsed = (key: string) => collapsed.has(key);

  const renderValue = (value: any, key: string, currentPath: string): JSX.Element => {
    const indent = level * 20;
    const fullPath = currentPath;

    if (value === null) {
      return (
        <span className="text-gray-400">null</span>
      );
    }

    if (value === undefined) {
      return (
        <span className="text-gray-400">undefined</span>
      );
    }

    if (typeof value === 'string') {
      return (
        <span className="text-green-400">
          "{value}"
        </span>
      );
    }

    if (typeof value === 'number') {
      return <span className="text-blue-400">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-400">{value ? 'true' : 'false'}</span>;
    }

    if (Array.isArray(value)) {
      const isOpen = !isCollapsed(fullPath);
      const itemCount = value.length;

      return (
        <div>
          <div
            className="flex items-center cursor-pointer hover:bg-gray-800 py-1 rounded"
            style={{ paddingLeft: `${indent}px` }}
            onClick={() => toggleCollapse(fullPath)}
          >
            <span className="text-gray-400 mr-2 select-none w-4 text-center">
              {isOpen ? '▼' : '▶'}
            </span>
            <span className="text-yellow-400">[</span>
            <span className="text-gray-400 ml-2 text-xs">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            {!isOpen && <span className="text-yellow-400 ml-2">]</span>}
          </div>
          {isOpen && (
            <div>
              {value.map((item, index) => (
                <div key={index}>
                  <div style={{ paddingLeft: `${indent + 20}px` }} className="py-0.5">
                    <span className="text-gray-400 text-xs">{index}: </span>
                    {renderValue(item, `${index}`, `${fullPath}[${index}]`)}
                    {index < value.length - 1 && <span className="text-gray-500">,</span>}
                  </div>
                </div>
              ))}
              <div
                style={{ paddingLeft: `${indent}px` }}
                className="text-yellow-400"
              >
                ]
              </div>
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isOpen = !isCollapsed(fullPath);
      const keys = Object.keys(value);
      const itemCount = keys.length;

      return (
        <div>
          <div
            className="flex items-center cursor-pointer hover:bg-gray-800 py-1 rounded"
            style={{ paddingLeft: `${indent}px` }}
            onClick={() => toggleCollapse(fullPath)}
          >
            <span className="text-gray-400 mr-2 select-none w-4 text-center">
              {isOpen ? '▼' : '▶'}
            </span>
            <span className="text-yellow-400">{'{'}</span>
            <span className="text-gray-400 ml-2 text-xs">
              {itemCount} {itemCount === 1 ? 'key' : 'keys'}
            </span>
            {!isOpen && <span className="text-yellow-400 ml-2">{'}'}</span>}
          </div>
          {isOpen && (
            <div>
              {keys.map((k, idx) => {
                const newPath = fullPath ? `${fullPath}.${k}` : k;
                return (
                  <div key={k}>
                    <div style={{ paddingLeft: `${indent + 20}px` }} className="py-0.5">
                      <span className="text-blue-300">"{k}"</span>
                      <span className="text-gray-500">: </span>
                      {renderValue(value[k], k, newPath)}
                      {idx < keys.length - 1 && <span className="text-gray-500">,</span>}
                    </div>
                  </div>
                );
              })}
              <div
                style={{ paddingLeft: `${indent}px` }}
                className="text-yellow-400"
              >
                {'}'}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className="font-mono text-xs text-green-400">
      {renderValue(data, 'root', '')}
    </div>
  );
}

export default JsonViewer;

