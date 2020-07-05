import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase } from '@fortawesome/free-solid-svg-icons/faDatabase';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons/faTrashAlt';
import { faEye } from '@fortawesome/free-solid-svg-icons/faEye';
import classNames from 'classnames';
import Modal from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { object, string } from 'yup';
import FlashMessageRender from '@/components/FlashMessageRender';
import { ServerContext } from '@/state/server';
import deleteServerDatabase from '@/api/server/deleteServerDatabase';
import { httpErrorToHuman } from '@/api/http';
import RotatePasswordButton from '@/components/server/databases/RotatePasswordButton';
import Can from '@/components/elements/Can';
import { ServerDatabase } from '@/api/server/getServerDatabases';
import useServer from '@/plugins/useServer';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Label from '@/components/elements/Label';
import Input from '@/components/elements/Input';
import GreyRowBox from '@/components/elements/GreyRowBox';

interface Props {
    database: ServerDatabase;
    className?: string;
}

export default ({ database, className }: Props) => {
    const { uuid } = useServer();
    const { addError, clearFlashes } = useFlash();
    const [ visible, setVisible ] = useState(false);
    const [ connectionVisible, setConnectionVisible ] = useState(false);

    const appendDatabase = ServerContext.useStoreActions(actions => actions.databases.appendDatabase);
    const removeDatabase = ServerContext.useStoreActions(actions => actions.databases.removeDatabase);

    const schema = object().shape({
        confirm: string()
            .required('The database name must be provided.')
            .oneOf([ database.name.split('_', 2)[1], database.name ], 'The database name must be provided.'),
    });

    const submit = (values: { confirm: string }, { setSubmitting }: FormikHelpers<{ confirm: string }>) => {
        clearFlashes();
        deleteServerDatabase(uuid, database.id)
            .then(() => {
                setVisible(false);
                setTimeout(() => removeDatabase(database.id), 150);
            })
            .catch(error => {
                console.error(error);
                setSubmitting(false);
                addError({ key: 'database:delete', message: httpErrorToHuman(error) });
            });
    };

    return (
        <>
            <Formik
                onSubmit={submit}
                initialValues={{ confirm: '' }}
                validationSchema={schema}
                isInitialValid={false}
            >
                {
                    ({ isSubmitting, isValid, resetForm }) => (
                        <Modal
                            visible={visible}
                            dismissable={!isSubmitting}
                            showSpinnerOverlay={isSubmitting}
                            onDismissed={() => {
                                setVisible(false);
                                resetForm();
                            }}
                        >
                            <FlashMessageRender byKey={'database:delete'} css={tw`mb-6`}/>
                            <h2 css={tw`text-2xl mb-6`}>Confirm database deletion</h2>
                            <p css={tw`text-sm`}>
                                Deleting a database is a permanent action, it cannot be undone. This will permanetly
                                delete the <strong>{database.name}</strong> database and remove all associated data.
                            </p>
                            <Form css={tw`m-0 mt-6`}>
                                <Field
                                    type={'text'}
                                    id={'confirm_name'}
                                    name={'confirm'}
                                    label={'Confirm Database Name'}
                                    description={'Enter the database name to confirm deletion.'}
                                />
                                <div css={tw`mt-6 text-right`}>
                                    <Button
                                        type={'button'}
                                        isSecondary
                                        css={tw`mr-2`}
                                        onClick={() => setVisible(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type={'submit'}
                                        color={'red'}
                                        disabled={!isValid}
                                    >
                                        Delete Database
                                    </Button>
                                </div>
                            </Form>
                        </Modal>
                    )
                }
            </Formik>
            <Modal visible={connectionVisible} onDismissed={() => setConnectionVisible(false)}>
                <FlashMessageRender byKey={'database-connection-modal'} css={tw`mb-6`}/>
                <h3 css={tw`mb-6`}>Database connection details</h3>
                <Can action={'database.view_password'}>
                    <div>
                        <Label>Password</Label>
                        <Input type={'text'} readOnly value={database.password}/>
                    </div>
                </Can>
                <div css={tw`mt-6`}>
                    <Label>JBDC Connection String</Label>
                    <Input
                        type={'text'}
                        readOnly
                        value={`jdbc:mysql://${database.username}:${database.password}@${database.connectionString}/${database.name}`}
                    />
                </div>
                <div css={tw`mt-6 text-right`}>
                    <Can action={'database.update'}>
                        <RotatePasswordButton databaseId={database.id} onUpdate={appendDatabase}/>
                    </Can>
                    <Button isSecondary onClick={() => setConnectionVisible(false)}>
                        Close
                    </Button>
                </div>
            </Modal>
            <GreyRowBox $hoverable={false} className={className}>
                <div>
                    <FontAwesomeIcon icon={faDatabase} fixedWidth/>
                </div>
                <div css={tw`flex-1 ml-4`}>
                    <p css={tw`text-lg`}>{database.name}</p>
                </div>
                <div css={tw`ml-8 text-center`}>
                    <p css={tw`text-sm`}>{database.connectionString}</p>
                    <p css={tw`mt-1 text-2xs text-neutral-500 uppercase select-none`}>Endpoint</p>
                </div>
                <div css={tw`ml-8 text-center`}>
                    <p css={tw`text-sm`}>{database.allowConnectionsFrom}</p>
                    <p css={tw`mt-1 text-2xs text-neutral-500 uppercase select-none`}>Connections from</p>
                </div>
                <div css={tw`ml-8 text-center`}>
                    <p css={tw`text-sm`}>{database.username}</p>
                    <p css={tw`mt-1 text-2xs text-neutral-500 uppercase select-none`}>Username</p>
                </div>
                <div css={tw`ml-8`}>
                    <Button isSecondary css={tw`mr-2`} onClick={() => setConnectionVisible(true)}>
                        <FontAwesomeIcon icon={faEye} fixedWidth/>
                    </Button>
                    <Can action={'database.delete'}>
                        <Button color={'red'} isSecondary onClick={() => setVisible(true)}>
                            <FontAwesomeIcon icon={faTrashAlt} fixedWidth/>
                        </Button>
                    </Can>
                </div>
            </GreyRowBox>
        </>
    );
};
